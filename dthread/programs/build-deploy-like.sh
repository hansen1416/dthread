#!/bin/bash
cargo build-bpf --manifest-path=./like/Cargo.toml --bpf-out-dir=/home/hlz/solana-projects/dthread/dist/programs/like

solana program deploy --program-id /home/hlz/solana-projects/dthread/dist/programs/like/like-keypair.json \
/home/hlz/solana-projects/dthread/dist/programs/like/like.so