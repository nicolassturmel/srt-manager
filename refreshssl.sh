#!/bin/bash
mkdir keys_and_certs
mkdir -p ./htmlUnsecure/.well-known/acme-challenge
docker run -it -v $(pwd)/keys_and_certs:/data -v $(pwd)/htmlUnsecure/.well-known/acme-challenge:/webroot -u $(id -u) --rm zerossl/client:latest --key account.key --csr domain.csr --csr-key domain.key --crt domain.crt --domains "ravenna-wan.sturmel.com,ravenna-wan.tests.merging.com" --generate-missing --path /webroot --unlink --live
cp keys_and_certs/domain.* .
docker-compose restart