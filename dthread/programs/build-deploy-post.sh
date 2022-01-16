#!/bin/bash
cargo build-bpf --manifest-path=./post/Cargo.toml --bpf-out-dir=/home/hlz/solana-projects/dthread/dist/programs/post

solana program deploy --program-id /home/hlz/solana-projects/dthread/dist/programs/post/post-keypair.json \
/home/hlz/solana-projects/dthread/dist/programs/post/post.so