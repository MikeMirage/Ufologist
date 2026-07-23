#!/bin/zsh
# Completa data/launches-per-year.json ejecutando el fetcher reanudable en bucle,
# esperando ~1 h entre lotes para respetar el rate-limit de LL2 (~15/h).
# Termina cuando el dataset está completo (1957→año en curso).
cd "$(dirname "$0")/.." || exit 1
for i in $(seq 1 12); do
  echo "=== lote $i ($(date '+%H:%M')) ==="
  node tools/fetch-launch-history.js
  if node -e "const j=require('./data/launches-per-year.json');const y=new Date().getUTCFullYear();let n=0;for(let k=1957;k<=y;k++)if(j.byYear[k]!=null)n++;process.exit(n>=(y-1957+1)?0:1)"; then
    echo "=== COMPLETO ==="; exit 0
  fi
  echo "esperando 3700s por el rate-limit..."; sleep 3700
done
