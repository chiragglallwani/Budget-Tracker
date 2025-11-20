"""
Custom exception handler for Django REST Framework
Transforms all responses to standardized format:
{
    success: boolean,
    message?: string,
    error?: <any error>,
    data?: <any data>
}
"""
from rest_framework.views import exception_handler
from rest_framework import status
from typing import Any, Optional, Dict
from finance.utils import error_response


def custom_exception_handler(exc, context):
    """
    Custom exception handler that formats all errors to the standardized response format.
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    if response is not None:
        # Get the error data from the response
        error_data = response.data
        status_code = response.status_code
        
        # Determine if it's a validation error (400) or other error
        if status_code == status.HTTP_400_BAD_REQUEST:
            # Validation errors - keep the field errors as-is
            error = error_data
            # Try to extract a message from validation errors
            message = None
            if isinstance(error_data, dict):
                if "detail" in error_data:
                    message = error_data["detail"]
                elif "non_field_errors" in error_data:
                    non_field_errors = error_data["non_field_errors"]
                    if isinstance(non_field_errors, list) and len(non_field_errors) > 0:
                        message = non_field_errors[0]
                else:
                    # Get first field error
                    for key, value in error_data.items():
                        if isinstance(value, list) and len(value) > 0:
                            message = f"{key}: {value[0]}"
                            break
                        elif isinstance(value, str):
                            message = f"{key}: {value}"
                            break
        else:
            # Other errors (401, 403, 404, 500, etc.)
            error = error_data
            message = None
            if isinstance(error_data, dict):
                if "detail" in error_data:
                    message = error_data["detail"]
                elif "message" in error_data:
                    message = error_data["message"]
            elif isinstance(error_data, str):
                message = error_data
                error = error_data
        
        # Return standardized error response
        return error_response(
            error=error,
            message=message,
            status_code=status_code
        )
    
    # If response is None, let Django handle it (500 errors, etc.)
    return response

