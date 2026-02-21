# @TASK P8-T3 - File storage service
"""File storage service for handling file uploads and downloads."""
import os
from pathlib import Path
from typing import Optional

from fastapi import HTTPException, UploadFile, status


class LocalStorage:
    """Local filesystem storage for uploaded files."""

    # Maximum file size: 10MB
    MAX_FILE_SIZE = 10 * 1024 * 1024

    # Allowed file extensions
    ALLOWED_EXTENSIONS = {
        ".pdf",
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".txt",
        ".csv",
        ".json",
    }

    def __init__(self, base_path: str = "uploads"):
        """Initialize storage with a base path.

        Args:
            base_path: Base directory for storing files
        """
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

    async def save_file(self, file: UploadFile, task_id: str) -> dict:
        """Save uploaded file to local filesystem.

        Args:
            file: The uploaded file
            task_id: ID of the task this file belongs to

        Returns:
            dict with filename, size, and path

        Raises:
            HTTPException: If file is too large or has invalid extension
        """
        # Validate file extension
        file_ext = Path(file.filename or "").suffix.lower()
        if file_ext not in self.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"File extension {file_ext} is not allowed. "
                f"Allowed extensions: {', '.join(self.ALLOWED_EXTENSIONS)}",
            )

        # Read file content
        content = await file.read()
        file_size = len(content)

        # Validate file size
        if file_size > self.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"File is too large. Maximum size is {self.MAX_FILE_SIZE / (1024 * 1024):.0f}MB",
            )

        # Create task-specific directory
        task_dir = self.base_path / task_id
        task_dir.mkdir(parents=True, exist_ok=True)

        # Save file
        file_path = task_dir / (file.filename or "unnamed")
        with open(file_path, "wb") as f:
            f.write(content)

        return {
            "filename": file.filename,
            "size": file_size,
            "path": str(file_path),
        }

    def get_file_path(self, task_id: str, filename: str) -> Optional[Path]:
        """Get the full path to a stored file.

        Args:
            task_id: ID of the task
            filename: Name of the file

        Returns:
            Path object if file exists, None otherwise
        """
        file_path = self.base_path / task_id / filename
        return file_path if file_path.exists() else None

    def delete_file(self, file_path: str) -> bool:
        """Delete a file from storage.

        Args:
            file_path: Path to the file to delete

        Returns:
            True if file was deleted, False if file didn't exist
        """
        path = Path(file_path)
        if path.exists():
            path.unlink()
            return True
        return False

    def delete_task_files(self, task_id: str) -> int:
        """Delete all files associated with a task.

        Args:
            task_id: ID of the task

        Returns:
            Number of files deleted
        """
        task_dir = self.base_path / task_id
        if not task_dir.exists():
            return 0

        count = 0
        for file_path in task_dir.iterdir():
            if file_path.is_file():
                file_path.unlink()
                count += 1

        # Remove the directory if empty
        try:
            task_dir.rmdir()
        except OSError:
            pass  # Directory not empty

        return count


# Global storage instance
storage = LocalStorage()
