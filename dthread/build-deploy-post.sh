#!/bin/bash
cargo build-bpf --manifest-path=./programs/post/Cargo.toml --bpf-out-dir=dist/programs/post

solana program deploy --program-id /home/hlz/solana-projects/dthread/dist/programs/post/post-keypair.json \
/home/hlz/solana-projects/dthread/dist/programs/post/post.so