FROM alpine:3.4

# install node and curl
RUN apk update && apk add \
    nodejs \
    curl \
    && rm -rf /var/cache/apk/*


# install app
RUN mkdir -p /opt/app
ADD . /opt/app
RUN cd /opt/app && npm install


# get ContainerPilot release
ENV CONTAINERPILOT_VERSION 2.4.1
RUN export CP_SHA1=198d96c8d7bfafb1ab6df96653c29701510b833c \
    && curl -Lso /tmp/containerpilot.tar.gz \
         "https://github.com/joyent/containerpilot/releases/download/${CONTAINERPILOT_VERSION}/containerpilot-${CONTAINERPILOT_VERSION}.tar.gz" \
    && echo "${CP_SHA1}  /tmp/containerpilot.tar.gz" | sha1sum -c \
    && tar zxf /tmp/containerpilot.tar.gz -C /bin \
    && rm /tmp/containerpilot.tar.gz


# add ContainerPilot configuration and scripts
COPY containerpilot.json /etc/containerpilot.json
ENV CONTAINERPILOT=file:///etc/containerpilot.json


EXPOSE 8000
CMD [ "/bin/containerpilot", \
      "node", \
      "/opt/app/serializer.js" \
]
