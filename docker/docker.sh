#!/bin/bash

docker run -itd --mount type=bind,source=$HOME/solana-example,target=/app/solana-example \
--net=host --name sol hansen1416/solana