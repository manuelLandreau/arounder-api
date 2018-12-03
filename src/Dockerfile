FROM symfony:latest

RUN \
    apt-get update && \
    apt-get install libldap2-dev -y && \
    rm -rf /var/lib/apt/lists/* && \
    docker-php-ext-configure ldap --with-libdir=lib/x86_64-linux-gnu/ && \
    docker-php-ext-install ldap

RUN mkdir /root/.ssh

RUN set -eux; \
	{ \
		echo 'Host gitlab.svc.sigma.host'; \
		echo '    StrictHostKeyChecking no'; \
	} > /root/.ssh/config



COPY id_rsa* /root/.ssh/
RUN chmod 600 /root/.ssh/*

RUN git clone git@gitlab.svc.sigma.host:eos/Calculette-AVV.git  /var/www/html/Calculette-AVV


RUN cd ../Calculette-AVV && git checkout feature/login


#docker run -p 48008:8000 -v Calculette-AVV:/var/www/html/Calculette-AVV calculette php ../Calculette-AVV/calculette_avv_back/bin/console server:run 0.0.0.0:8000


RUN cd /var/www/html/Calculette-AVV/calculette_avv_back && composer install

# install nodejs, gnupg2 for verify package signature
RUN apt-get update \
&& apt-get install -y gnupg2

RUN curl -sL https://deb.nodesource.com/setup_8.x | bash - \
&& apt-get install -y nodejs

RUN cd /var/www/html/Calculette-AVV/calculette_avv_front && npm install

docker run -p 48008:8000 -v Calculette-AVV:/var/www/html/Calculette-AVV calculette php ../Calculette-AVV/calculette_avv_back/bin/console server:run 0.0.0.0:8000