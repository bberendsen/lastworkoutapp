FROM php:8.4-cli

# Install system dependencies and required PHP extensions.
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql \
    && rm -rf /var/lib/apt/lists/*

# Install Composer from the official Composer image.
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Install PHP dependencies first for better layer caching.
COPY composer.json composer.lock ./
RUN composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

# Copy the rest of the application.
COPY . .

EXPOSE 10000

CMD sh -c "php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=${PORT:-10000}"
