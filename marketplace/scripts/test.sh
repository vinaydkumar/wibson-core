#!/usr/bin/env bash

# Script based on:
# https://github.com/OpenZeppelin/openzeppelin-solidity/blob/0b33d29e411893b134ad67ca92043e8629c44325/scripts/test.sh

# Exit script as soon as a command fails.
set -o errexit

# Executes cleanup function at script exit.
trap cleanup EXIT

cleanup() {
  # Kill the ganache instance that we started (if we started one and if it's still running).
  if [ -n "$ganache_pid" ] && ps -p "$ganache_pid" > /dev/null; then
    kill -9 "$ganache_pid"
  fi
}

if [ "$SOLIDITY_COVERAGE" = true ]; then
  ganache_port=8555
else
  ganache_port=8545
fi

ganache_running() {
  nc -z localhost "$ganache_port"
}

start_ganache() {
  local ganacheParameters=(
    --port "$ganache_port"
    --gasLimit 0xfffffffffff
    # We define 10 accounts with balance 1M ether, needed for high-value tests.
    --account="0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501200,1000000000000000000000000"
    --account="0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501201,1000000000000000000000000"
    --account="0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501202,1000000000000000000000000"
    --account="0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501203,1000000000000000000000000"
    --account="0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501204,1000000000000000000000000"
    --account="0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501205,1000000000000000000000000"
    --account="0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501206,1000000000000000000000000"
    --account="0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501207,1000000000000000000000000"
    --account="0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501208,1000000000000000000000000"
    --account="0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501209,1000000000000000000000000"
  )

  if [ "$SOLIDITY_COVERAGE" = true ]; then
    node_modules/.bin/ganache-cli-coverage "${ganacheParameters[@]}" > /dev/null &
  else
    node_modules/.bin/ganache-cli "${ganacheParameters[@]}" > /dev/null &
  fi

  ganache_pid=$!

  echo "pid: ${ganache_pid}"
}

if ganache_running; then
  echo "Using existing ganache instance"
else
  echo "Starting our own ganache instance"
  start_ganache
fi

if [ "$SOLIDITY_COVERAGE" = true ]; then
  node_modules/.bin/solidity-coverage
elif [ "$INSPECT" = true ]; then
  node inspect node_modules/.bin/truffle test "$@"
elif [ "$BENCHMARK" = true ]; then
  truffle migrate --reset --compile-all
  truffle exec test/benchmark.js
else
  node_modules/.bin/truffle test "$@"
fi
