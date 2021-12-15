FROM rust:1.56-buster
# FROM ubuntu:20.04

# avoid error "debconf: delaying package configuration, since apt-utils is not installed", not important
ARG DEBIAN_FRONTEND=noninteractive

WORKDIR /app

COPY ./solana-release-x86_64-unknown-linux-gnu.tar.bz2 ./

RUN tar jxf solana-release-x86_64-unknown-linux-gnu.tar.bz2

ENV PATH="/app/solana-release/bin:${PATH}"

# # install some basic packages, feel free to add more
RUN apt-get clean && apt-get update && \
    apt-get -y install apt-utils wget curl git zip unzip nodejs npm && \
    npm cache clean -f && npm install -g n && n stable

CMD ["tail", "-f", "/dev/null"]
