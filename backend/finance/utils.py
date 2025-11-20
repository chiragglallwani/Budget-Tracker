"""
Utility functions for standardized API responses
"""
from rest_framework.response import Response
from rest_framework import status
from typing import Any, Optional, Dict


def success_response(
    data: Any = None,
    message: Optional[str] = None,
    status_code: int = status.HTTP_200_OK
) -> Response:
    """
    Returns a standardized success response.
    
    Args:
        data: The data to return (optional)
        message: Optional success message
        status_code: HTTP status code (default: 200)
    
    Returns:
        Response with format: { success: True, data: ..., message: ... }
    """
    response_data = {
        "success": True,
    }
    
    if data is not None:
        response_data["data"] = data
    
    if message:
        response_data["message"] = message
    
    return Response(response_data, status=status_code)


def error_response(
    error: Any,
    message: Optional[str] = None,
    status_code: int = status.HTTP_400_BAD_REQUEST
) -> Response:
    """
    Returns a standardized error response.
    
    Args:
        error: Error details (can be string, dict, or list)
        message: Optional error message (if not provided, will try to extract from error)
        status_code: HTTP status code (default: 400)
    
    Returns:
        Response with format: { success: False, error: ..., message: ... }
    """
    response_data = {
        "success": False,
    }
    
    # Add error field
    if error is not None:
        response_data["error"] = error
    
    # Add message field
    if message:
        response_data["message"] = message
    elif isinstance(error, str):
        response_data["message"] = error
    elif isinstance(error, dict) and "detail" in error:
        response_data["message"] = error["detail"]
    elif isinstance(error, dict) and "non_field_errors" in error:
        errors = error["non_field_errors"]
        if isinstance(errors, list) and len(errors) > 0:
            response_data["message"] = errors[0]
    
    return Response(response_data, status=status_code)

