# core/verification_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import login
from django.utils import timezone
from datetime import timedelta
import logging

from .models import User

logger = logging.getLogger(__name__)


class VerifyEmailView(APIView):
    """
    Verify user email with the code sent via email
    """
    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        code = request.data.get('code')

        logger.debug(f"Verification attempt for email: {email}, code: {code}")

        if not email or not code:
            return Response({
                'message': 'Email and verification code are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            
            # Check if user is already active
            if user.is_active:
                return Response({
                    'message': 'Email already verified'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Check if verification code matches
            if user.verification_code != code:
                logger.debug(f"Invalid code. Expected: {user.verification_code}, Got: {code}")
                return Response({
                    'message': 'Invalid verification code'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Check if code has expired (10 minutes)
            if user.verification_code_created_at:
                expiry_time = user.verification_code_created_at + timedelta(minutes=10)
                if timezone.now() > expiry_time:
                    logger.debug(f"Code expired. Created: {user.verification_code_created_at}, Now: {timezone.now()}")
                    return Response({
                        'message': 'Verification code has expired. Please request a new one.'
                    }, status=status.HTTP_400_BAD_REQUEST)

            # Activate user
            user.is_active = True
            user.verification_code = None  # Clear the code
            user.verification_code_created_at = None
            user.save()

            # Log the user in
            login(request, user)

            # Determine user role for redirect
            user_role = None
            if user.role:
                user_role = user.role.role_name.lower()
            elif user.is_superuser:
                user_role = 'admin'

            logger.info(f"User {user.username} verified and logged in successfully")
            
            return Response({
                'message': 'Email verified successfully',
                'user': {
                    'username': user.username,
                    'email': user.email,
                    'role': user_role
                }
            }, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            logger.debug(f"User not found with email: {email}")
            return Response({
                'message': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error during verification: {str(e)}")
            return Response({
                'message': f'Error during verification: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ResendVerificationCodeView(APIView):
    """
    Resend verification code to user's email
    """
    def post(self, request, *args, **kwargs):
        from django.core.mail import send_mail
        from django.conf import settings
        import random

        email = request.data.get('email')

        if not email:
            return Response({
                'message': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)

            # Check if user is already active
            if user.is_active:
                return Response({
                    'message': 'Email already verified'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Generate new verification code
            verification_code = str(random.randint(100000, 999999))
            user.verification_code = verification_code
            user.verification_code_created_at = timezone.now()
            user.save()

            # Send verification email
            try:
                send_mail(
                    subject='ParkIt - New Verification Code',
                    message=f'Your new verification code is: {verification_code}\n\nThis code will expire in 10 minutes.',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    fail_silently=False,
                )
                logger.info(f"New verification email sent to {email}")
            except Exception as email_error:
                logger.error(f"Failed to send verification email: {str(email_error)}")
                return Response({
                    'message': 'Failed to send verification email'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            return Response({
                'message': 'Verification code resent successfully'
            }, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            logger.debug(f"User not found with email: {email}")
            return Response({
                'message': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error resending code: {str(e)}")
            return Response({
                'message': f'Error resending code: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
