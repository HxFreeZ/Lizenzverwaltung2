# Lizenzverwaltung

Eine kleine, komplett clientseitige Web-Anwendung zum Verwalten und Nachverfolgen von Software-Lizenzen pro Hersteller.

## Funktionen

- Übersicht aller Hersteller mit Direktlink in die Detailseiten
- Admin-Login (Standard-Passwort: `admin123`) zum Anlegen und Löschen von Herstellern
- Pro Hersteller frei konfigurierbare Tabellenspalten und Zeilen
- Hinzufügen, Bearbeiten (inline) und Löschen einzelner Zeilen sowie Spalten
- Speicherung aller Daten im Browser (LocalStorage)
- Responsives Layout sowie Dialoge mit Rückmeldungen

## Nutzung

1. Öffne `index.html` in einem Browser.
2. Aktiviere den Admin-Modus über den Button **Admin-Login** und gib das Passwort ein.
3. Lege neue Hersteller an oder lösche bestehende.
4. Öffne eine Hersteller-Seite, um dort Zeilen und Spalten zu verwalten.
5. Über den Button **Admin-Modus beenden** kann der Bearbeitungsmodus wieder deaktiviert werden.

Das Admin-Passwort kann in `assets/js/dataStore.js` angepasst werden.
