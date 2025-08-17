#!/bin/bash
set -xe
pio pkg exec -p tool-esptoolpy esptool.py -- --chip esp32s3 merge-bin \
  -o m5atoms3u-wifi-usb-keyboard.bin \
  --flash-mode dio \
  --flash-freq 80m \
  --flash-size 8MB \
  0x0000 .pio/build/atoms3u/bootloader.bin \
  0x8000 .pio/build/atoms3u/partitions.bin \
  0xe000 ~/.platformio/packages/framework-arduinoespressif32/tools/partitions/boot_app0.bin \
  0x10000 .pio/build/atoms3u/firmware.bin