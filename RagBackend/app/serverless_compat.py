"""
Serverless runtime compatibility layer for AWS Lambda and Vercel.
Resolves [Errno 2] No such file or directory caused by missing /dev/shm for multiprocessing.SemLock.
"""

import sys
import os
from concurrent.futures import ThreadPoolExecutor
import multiprocessing.pool
import multiprocessing.context


class ServerlessAsyncResult:
    """Drop-in replacement for multiprocessing AsyncResult using concurrent.futures."""
    def __init__(self, future):
        self._future = future

    def get(self, timeout=None):
        return self._future.result(timeout=timeout)

    def wait(self, timeout=None):
        try:
            self._future.result(timeout=timeout)
        except Exception:
            pass

    def ready(self):
        return self._future.done()

    def successful(self):
        return self._future.done() and self._future.exception() is None


class ServerlessThreadPool:
    """
    Drop-in replacement for multiprocessing.pool.ThreadPool that uses
    standard threading.Thread / ThreadPoolExecutor instead of POSIX semaphores.
    Works seamlessly on Vercel / AWS Lambda without requiring /dev/shm.
    """
    def __init__(self, processes=None, initializer=None, initargs=()):
        if initializer:
            try:
                initializer(*initargs)
            except Exception:
                pass
        self._executor = ThreadPoolExecutor(max_workers=processes or 8)

    def apply_async(self, func, args=(), kwds=None, callback=None, error_callback=None):
        kwds = kwds or {}
        future = self._executor.submit(func, *args, **kwds)
        if callback:
            future.add_done_callback(lambda f: callback(f.result()) if f.exception() is None else None)
        if error_callback:
            future.add_done_callback(lambda f: error_callback(f.exception()) if f.exception() is not None else None)
        return ServerlessAsyncResult(future)

    def apply(self, func, args=(), kwds=None):
        kwds = kwds or {}
        return func(*args, **kwds)

    def map(self, func, iterable, chunksize=None):
        return list(self._executor.map(func, iterable))

    def map_async(self, func, iterable, chunksize=None, callback=None, error_callback=None):
        future = self._executor.submit(lambda: list(map(func, iterable)))
        if callback:
            future.add_done_callback(lambda f: callback(f.result()) if f.exception() is None else None)
        if error_callback:
            future.add_done_callback(lambda f: error_callback(f.exception()) if f.exception() is not None else None)
        return ServerlessAsyncResult(future)

    def close(self):
        self._executor.shutdown(wait=False)

    def terminate(self):
        self._executor.shutdown(wait=False)

    def join(self):
        pass


def apply_serverless_patches():
    """Applies threading patches to prevent SemLock /dev/shm crashes on serverless."""
    multiprocessing.pool.ThreadPool = ServerlessThreadPool
    multiprocessing.context.ThreadPool = ServerlessThreadPool


# Apply patches immediately on import
apply_serverless_patches()
