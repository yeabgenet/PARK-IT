class RegisterServiceProviderView(APIView):
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        gender = request.data.get('gender', '')
        phone_number = request.data.get('phone_number')
        age = request.data.get('age')
        country = request.data.get('country')
        city = request.data.get('city')
        address = request.data.get('address')
        company_name = request.data.get('company_name')
        contact_person = request.data.get('contact_person')
        profile_picture = request.FILES.get('profile_picture')
        role_name = request.data.get('role', 'Service Provider').lower()

        logger.debug(f"Registering service provider: {username}, email: {email}, role: {role_name}")

        if not all([username, email, password, phone_number, age, country, city, address, company_name, contact_person]):
            logger.debug(f"Missing required fields: username={username}, email={email}, phone_number={phone_number}, age={age}, country={country}, city={city}, address={address}, company_name={company_name}, contact_person={contact_person}")
            return Response({
                'message': 'All fields are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            logger.debug(f"Username already exists: {username}")
            return Response({
                'message': 'Username already exists'
            }, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            logger.debug(f"Email already exists: {email}")
            return Response({
                'message': 'Email already exists'
            }, status=status.HTTP_400_BAD_REQUEST)

        if ServiceProvider.objects.filter(phone_number=phone_number).exists():
            logger.debug(f"Phone number already exists: {phone_number}")
            return Response({
                'message': 'Phone number already exists'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            role, _ = Role.objects.get_or_create(role_name='Service Provider')
            
            # Generate 6-digit verification code
            verification_code = str(random.randint(100000, 999999))
            
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                gender=gender,
                role=role
            )
            if profile_picture:
                user.profile_picture = profile_picture
            user.is_active = False  # User must verify email first
            user.verification_code = verification_code
            user.verification_code_created_at = timezone.now()
            user.save()

            ServiceProvider.objects.create(
                user=user,
                phone_number=phone_number,
                age=int(age),
                country=country,
                city=city,
                address=address,
                company_name=company_name,
                contact_person=contact_person
            )

            # Send verification email
            try:
                send_mail(
                    subject='ParkIt - Email Verification Code',
                    message=f'Your verification code is: {verification_code}\n\nThis code will expire in 10 minutes.',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    fail_silently=False,
                )
                logger.info(f"Verification email sent to {email}")
            except Exception as email_error:
                logger.error(f"Failed to send verification email: {str(email_error)}")

            logger.info(f"Service Provider {username} created, awaiting email verification")
            return Response({
                'message': 'Registration successful. Please check your email for verification code.',
                'email': email,
                'requires_verification': True
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error creating service provider: {str(e)}")
            return Response({
                'message': f'Error creating user: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
