// Piano editoriale compatto in Numbers, font Overpass e colori Frigolo
//   osascript -l JavaScript crea.js <dati.json> <uscita.numbers>
function run(argv) {
  ObjC.import('Foundation')
  const dati = JSON.parse($.NSString.stringWithContentsOfFileEncodingError(argv[0], $.NSUTF8StringEncoding, null).js)
  const N = Application('com.apple.Numbers')
  const rgb = (h) => [0, 2, 4].map((i) => parseInt(h.substr(i + 1, 2), 16) * 257)
  const C = { lampone: '#b02e50', crema: '#fdf7f8', rosa: '#f8eef0', inchiostro: '#3b1d26', grigio: '#6f4a55' }
  const F = { reg: 'Overpass-Regular', semi: 'Overpass-SemiBold', bold: 'Overpass-Bold' }
  const LOG = []
  const P = (n, f) => { try { f() } catch (e) { LOG.push(n + ': ' + e.message) } }
  const col = (j) => String.fromCharCode(65 + j)
  const doc = N.Document().make()
  delay(1)
  try {
    function riempi(sheet, nome, colonne, righe, opz) {
      sheet.tables()[0].delete()
      sheet.tables.push(N.Table({ name: nome, rowCount: righe.length + 1, columnCount: colonne.length, headerRowCount: 1, headerColumnCount: 0, footerRowCount: 0 }))
      const tb = sheet.tables[nome]
      colonne.forEach((c, j) => { tb.rows[0].cells[j].value = c.titolo; P('w', () => { tb.columns[j].width = c.larghezza }) })
      righe.forEach((r, i) => colonne.forEach((c, j) => {
        if (c.chiave === null) return
        const v = r[c.chiave]
        if (v !== undefined && v !== '') P('v', () => { tb.rows[i + 1].cells[j].value = v })
      }))
      const h = tb.rows[0]
      P('h', () => { h.backgroundColor = rgb(C.lampone); h.textColor = rgb(C.crema); h.fontName = F.bold; h.fontSize = 11; h.height = 26; h.verticalAlignment = 'center' })
      for (let i = 1; i <= righe.length; i++) {
        const r = tb.rows[i]
        P('r', () => { r.backgroundColor = rgb(i % 2 ? C.crema : C.rosa); r.textColor = rgb(C.inchiostro); r.fontName = F.reg; r.fontSize = 11; r.verticalAlignment = opz.wrap ? 'top' : 'center'; r.textWrap = !!opz.wrap })
        if (!opz.wrap) P('ht', () => { r.height = 24 })
      }
      const ultima = righe.length + 1
      colonne.forEach((c, j) => {
        const rg = tb.ranges[`${col(j)}2:${col(j)}${ultima}`]
        if (c.forte) P('f', () => { rg.fontName = F.semi })
        if (c.accento) P('a', () => { rg.fontName = F.semi; rg.textColor = rgb(C.lampone) })
        if (c.tenue) P('t', () => { rg.textColor = rgb(C.grigio); rg.fontSize = 10 })
        if (c.centro) P('c', () => { rg.alignment = 'center' })
      })
      if (opz.check) P('ck', () => { tb.ranges[`A2:A${ultima}`].format = 'checkbox'; tb.ranges[`A2:A${ultima}`].alignment = 'center' })
    }
    const s1 = doc.sheets()[0]
    s1.name = 'Piano'
    riempi(s1, 'Piano editoriale Frigolo', [
      { titolo: '✓', chiave: null, larghezza: 30 },
      { titolo: 'Data', chiave: 'data', larghezza: 78, forte: true },
      { titolo: 'Ora', chiave: 'ora', larghezza: 46, centro: true },
      { titolo: 'Cod.', chiave: 'codice', larghezza: 48, tenue: true },
      { titolo: 'Contenuto', chiave: 'titolo', larghezza: 230, accento: true },
      { titolo: 'Formato', chiave: 'formatoBreve', larghezza: 175 },
      { titolo: 'Dove', chiave: 'doveBreve', larghezza: 130 },
      { titolo: 'Evidenza', chiave: 'evidenzaBreve', larghezza: 100 },
      { titolo: 'Attenzione', chiave: 'notaBreve', larghezza: 100, tenue: true },
      { titolo: 'Link al post', chiave: null, larghezza: 150 },
      { titolo: 'Note', chiave: null, larghezza: 170 },
    ], dati.post, { check: true })
    doc.sheets.push(N.Sheet({ name: 'Didascalie' }))
    riempi(doc.sheets['Didascalie'], 'Didascalie da copiare', [
      { titolo: 'Cod.', chiave: 'codice', larghezza: 48, tenue: true },
      { titolo: 'Contenuto', chiave: 'titolo', larghezza: 200, accento: true },
      { titolo: 'Didascalia', chiave: 'didascalia', larghezza: 520 },
    ], dati.post, { wrap: true })
    doc.sheets.push(N.Sheet({ name: 'Storie della pagina' }))
    riempi(doc.sheets['Storie della pagina'], 'Storie della pagina ' + dati.pagina, [
      { titolo: '✓', chiave: null, larghezza: 30 },
      { titolo: 'Raccolta', chiave: 'raccolta', larghezza: 130, accento: true },
      { titolo: 'Quando', chiave: 'quandoBreve', larghezza: 260, forte: true },
      { titolo: 'Storie', chiave: 'n', larghezza: 52, centro: true },
      { titolo: 'Cartella', chiave: 'cartella', larghezza: 220, tenue: true },
    ], dati.storie, { check: true })
    doc.save({ in: Path(argv[1]) })
  } finally { doc.close({ saving: 'no' }) }
  return LOG.length ? LOG.slice(0, 5).join('\n') : 'ok'
}
