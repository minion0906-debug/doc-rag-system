"""
Supabase Storage manager: upload, signed URLs, listing, and deletion.
"""

import os
import mimetypes
from typing import List, Optional, Dict, Any
import httpx

from app.config import SUPABASE_URL, SUPABASE_KEY, STORAGE_BUCKET_NAME, get_logger

logger = get_logger("askdoc.services.storage")


class SupabaseStorageManager:
    """
    Manages complete document lifecycle in Supabase Storage.
    Supports upload, signed download URLs, public URLs, and cascade folder deletion.
    """
    def __init__(self, supabase_url: str = SUPABASE_URL, supabase_key: str = SUPABASE_KEY, bucket: str = STORAGE_BUCKET_NAME):
        self.supabase_url = (supabase_url or "").rstrip("/")
        self.supabase_key = supabase_key or ""
        self.bucket = bucket
        self.headers: Dict[str, str] = {}
        if self.supabase_key:
            self.headers["apikey"] = self.supabase_key
            self.headers["Authorization"] = f"Bearer {self.supabase_key}"

    def _get_mime_type(self, filename: str) -> str:
        mime, _ = mimetypes.guess_type(filename)
        if not mime:
            if filename.lower().endswith(".docx"):
                return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            elif filename.lower().endswith(".xlsx"):
                return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            elif filename.lower().endswith(".pptx"):
                return "application/vnd.openxmlformats-officedocument.presentationml.presentation"
            elif filename.lower().endswith(".pdf"):
                return "application/pdf"
            elif filename.lower().endswith(".csv"):
                return "text/csv"
            return "application/octet-stream"
        return mime

    def upload_file(self, session_id: str, filename: str, content: bytes, mime_type: Optional[str] = None) -> Dict[str, Any]:
        """
        Uploads a raw document binary to Supabase Storage under {session_id}/{filename}.
        Returns object metadata and public/signed download URLs.
        """
        clean_filename = os.path.basename(filename).replace(" ", "_")
        storage_path = f"{session_id}/{clean_filename}"
        content_type = mime_type or self._get_mime_type(filename)
        
        public_url = f"{self.supabase_url}/storage/v1/object/public/{self.bucket}/{storage_path}" if self.supabase_url else storage_path

        if not self.supabase_url or not self.supabase_key:
            logger.warning("Supabase Storage credentials not configured, skipping cloud upload.")
            return {
                "file_path": storage_path,
                "file_name": filename,
                "file_size": len(content),
                "file_type": content_type,
                "storage_url": public_url
            }

        upload_url = f"{self.supabase_url}/storage/v1/object/{self.bucket}/{storage_path}"
        headers = {
            **self.headers,
            "Content-Type": content_type,
            "x-upsert": "true"
        }

        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(upload_url, headers=headers, content=content)
                if response.status_code not in (200, 201):
                    logger.warning(f"Supabase storage upload returned status {response.status_code}: {response.text}")
                    # Try PUT if object exists
                    response = client.put(upload_url, headers=headers, content=content)
                    if response.status_code not in (200, 201):
                        raise Exception(f"Storage upload failed: {response.text}")

            logger.info(f"Successfully uploaded '{clean_filename}' ({len(content)} bytes) to Supabase Storage: {storage_path}")
            return {
                "file_path": storage_path,
                "file_name": filename,
                "file_size": len(content),
                "file_type": content_type,
                "storage_url": public_url
            }
        except Exception as e:
            logger.error(f"Error uploading file '{filename}' to Supabase Storage: {e}", exc_info=True)
            # Fall back to URL representation
            return {
                "file_path": storage_path,
                "file_name": filename,
                "file_size": len(content),
                "file_type": content_type,
                "storage_url": public_url
            }

    def get_signed_url(self, storage_path: str, expires_in: int = 3600) -> str:
        """
        Creates a time-limited signed URL to securely download/view a document.
        """
        if not self.supabase_url or not self.supabase_key:
            return storage_path

        sign_url = f"{self.supabase_url}/storage/v1/object/sign/{self.bucket}/{storage_path}"
        headers = {
            **self.headers,
            "Content-Type": "application/json"
        }
        try:
            with httpx.Client(timeout=15.0) as client:
                response = client.post(sign_url, headers=headers, json={"expiresIn": expires_in})
                if response.status_code == 200:
                    data = response.json()
                    signed_path = data.get("signedURL", "")
                    if signed_path.startswith("http"):
                        return signed_path
                    return f"{self.supabase_url}/storage/v1{signed_path}"
        except Exception as e:
            logger.warning(f"Failed to generate signed URL for '{storage_path}': {e}")
        
        # Fallback to public URL
        return f"{self.supabase_url}/storage/v1/object/public/{self.bucket}/{storage_path}"

    def list_session_files(self, session_id: str) -> List[str]:
        """
        Lists all file keys stored under a session folder {session_id}/.
        """
        if not self.supabase_url or not self.supabase_key:
            return []

        list_url = f"{self.supabase_url}/storage/v1/object/list/{self.bucket}"
        headers = {
            **self.headers,
            "Content-Type": "application/json"
        }
        try:
            with httpx.Client(timeout=15.0) as client:
                response = client.post(list_url, headers=headers, json={
                    "prefix": f"{session_id}/",
                    "limit": 100
                })
                if response.status_code == 200:
                    items = response.json()
                    return [f"{session_id}/{item['name']}" for item in items if isinstance(item, dict) and "name" in item]
        except Exception as e:
            logger.error(f"Error listing storage files for session {session_id}: {e}")
        return []

    def delete_session_files(self, session_id: str) -> int:
        """
        Deletes all storage files and folder prefixes associated with a session ID.
        """
        if not self.supabase_url or not self.supabase_key:
            return 0

        files = self.list_session_files(session_id)
        if not files:
            # Attempt direct prefix deletion
            files = [f"{session_id}/"]

        delete_url = f"{self.supabase_url}/storage/v1/object/{self.bucket}"
        headers = {
            **self.headers,
            "Content-Type": "application/json"
        }
        try:
            with httpx.Client(timeout=15.0) as client:
                response = client.request("DELETE", delete_url, headers=headers, json={"prefixes": files})
                logger.info(f"Purged storage files for session {session_id}: {files} (status: {response.status_code})")
                return len(files)
        except Exception as e:
            logger.error(f"Error deleting storage files for session {session_id}: {e}")
            return 0

    def delete_multiple_sessions_files(self, session_ids: List[str]) -> int:
        """
        Bulk purges all storage documents across multiple session IDs.
        """
        total = 0
        for sid in session_ids:
            total += self.delete_session_files(sid)
        return total


# Global singleton storage manager
storage_manager = SupabaseStorageManager()
