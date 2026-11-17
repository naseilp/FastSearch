# FastSearch

Schnelle Datei- und Ordnersuche über alle Laufwerke – als Alternative zur Windows-Suche.

## Start

`FastSearch-x.x.x-portable.exe` per Doppelklick starten, eine Installation ist nicht nötig.

Beim ersten Start warnt Windows eventuell mit „Der Computer wurde durch Windows geschützt“. Dann auf **Weitere Informationen → Trotzdem ausführen** klicken.

## Bedienung

1. **Index aufbauen:** Über **„Index neu aufbauen“**. Das dauert einige Minuten. Nötig ist das:
   1. beim allerersten Start,
   2. wenn in der Statusleiste „Noch kein Index vorhanden“ oder „Letzte Indexierung nicht abgeschlossen“ steht,
   3. wenn sich viele Dateien geändert haben (neu erstellt, gelöscht, umbenannt oder verschoben).
2. **Suchen:** Suchbegriff eingeben und mit **Enter** bestätigen.
   - `bericht` findet alles, was „bericht“ im Namen enthält.
   - `*` steht für beliebig viele Zeichen, z. B. `*.docx`
   - `?` steht für genau ein Zeichen, z. B. `foto_??.jpg`
3. **Treffer nutzen:**
   - **Doppelklick** öffnet die Datei bzw. den Ordner.
   - **Rechtsklick** zeigt die Datei im Explorer.

## Gut zu wissen

- Es werden maximal **200 Treffer** angezeigt. Bei mehr bitte die Suche eingrenzen.
- Der Index wird **nicht automatisch** aktualisiert. Neue oder gelöschte Dateien erscheinen erst nach „Index neu aufbauen“.
- Ordner ohne Leseberechtigung (z. B. Systemordner) werden übersprungen.
- Der Index liegt unter `%LOCALAPPDATA%\FastSearch`.
