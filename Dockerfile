FROM php:8.2-apache

RUN apt-get update && apt-get install -y \
    zip unzip git libzip-dev

RUN docker-php-ext-install pdo pdo_mysql zip

COPY . /var/www/html

WORKDIR /var/www/html/BZ_POULTRY

RUN sed -ri -e 's!/var/www/html!/var/www/html/BZ_POULTRY/public!g' \
    /etc/apache2/sites-available/*.conf

EXPOSE 80