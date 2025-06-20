# Lern-Periode 10

25.4 bis 27.6

## Grob-Planung

1. Welche Programmiersprache möchten Sie verwenden? Was denken Sie, wo Ihre Zeit und Übung am sinnvollsten ist?
   **Ich werde JavaScript (Node.js/Express.js) verwenden**
1. Welche Datenbank-Technologie möchten Sie üben? Fühlen Sie sich sicher mit SQL und möchten etwas Neues ausprobieren; oder möchten Sie sich weiter mit SQL beschäftigen?
   **Ich werde SQLite nutzen**
1. Was wäre ein geeignetes Abschluss-Projekt?
  **Mein Abschlussprojekt wird eine Web-App für Freunde zum Teilen von Fotos in Alben sein, die Login, Uploads, Galerien und Album-Verwaltung beinhalten wird.**
## 25.4

Welche 3 *features* sind die wichtigsten Ihres Projektes? Wie können Sie die Machbarkeit dieser in jeweils 45' am einfachsten beweisen?

- [x] Benutzerauthentifizierung und Autorisierung
- [x] Foto-Upload
- [x] Anzeige von Fotos


✍️ Heute habe ich alle drei features aus arbeitspaketen hinzugefügt. Erstens User Authentication (Registrierung, Login, Logout) mit Sessions und Passwort-Hashing. Eingeloggte Users können Fotos hochladen, die gespeichert und in einer Galerie angezeigt werden. Zusätzlich habe ich ein einfaches Frontend mit html css und js gemacht.

☝️ Vergessen Sie nicht, den Code von heute auf github hochzuladen. Ggf. bietet es sich an, für die Code-Schnipsel einen eigenen Ordner `exploration` zu erstellen.

## 2.5

Ausgehend von Ihren Erfahrungen vom 25.4, welche *features* brauchen noch mehr Recherche? (Sie können auch mehrere AP für ein *feature* aufwenden.)

- [x] Frontend Design Mockup (📵)
- [x] Foto Löschfunktion
- [ ] Zoom auf Fotos mit click  
- [ ] nach wichtigen Aktionen (wie Login, Registrierung, Foto-Upload) kurze, klare Nachrichten direkt auf der Webseite anzeigen

✍️ Heute habe am anfang bemerkt das ein User nur seine eigene fotos sehen kann und nicht von allen. Also habe ich das implementiert, obwohl es kein Arbeitspaket war. Als nächstes machte ich einen Mockup für Frontend, den ich dann nächste woche anfange zu implementieren. Eine Löschfunktion habe ich auch hinzugefügt. Ein User kann nur seine Fotos löschen. Als letztes habe ich probiert eine Fullscreen funktion hinzufügen aber mit dem hatte ich mühe. Diesen Arbeitspaket verschiebe ich auf die nächste Woche.

## 9.5

Planen Sie nun Ihr Projekt, sodass die *Kern-Funktionalität* in 3 Sitzungen realisiert ist. Schreiben Sie dazu zunächst 3 solche übergeordneten Kern-Funktionalitäten auf: 

1. Kern-Funktionalität: Albums
2. Kern-Funktionalität: Groups (Groups sind sammlung von Usern die verschiedene Albums erstellen)
3. Kern-Funktionalität: Users zu Groups inviten (nach users suchen mit ID?)

Diese Kern-Funktionalitäten brechen Sie nun in etwa 4 AP je herunter. Versuchen Sie jetzt bereits, auch die Sitzung vom 16.5 und 23.5 zu planen (im Wissen, dass Sie kleine Anpassungen an Ihrer Planung vornehmen können).

- [ ] Frontend design implementieren
- [x] Albums hinzufügen (Teilweise geschafft)
- [x] Fullscreen Fotos mit click

✍️ Heute habe ich Fullscreen von Fotos beim Click hinzugefügt aber um das zu erreichen musste ich alle hover effekte und delete funktion löschen. Dann kam der Album Arbeitspaket und der hat alles kaputt gemacht. Ich konnte mich nicht einlogen und dann konnten die Bilder nicht aufgerufen werden usw. Doch das Issue mit Einlogen habe ich geschafft zu lösen. Die anderen Fehler sind immernoch aktiv. Zu Frontend design bin ich noch nicht gekommen. (50-100 Wörter)


## 16.5

- [ ] Datenbank (SQLite) fehler lösen 
- [x] Benutzerspezifische Fotoanzeige basierend auf Benutzername-Eingabe (ohne Login)
- [x] Nachrichten für Benutzeraktionen verbessern
- [ ] Albums feature weiterentwickeln

✍️ Heute habe ich insbesondere mit dem Datenbankfehler beschäftigt. Konnte es teilweise lösen aber es gibt noch probleme zu beheben. Die eigene Fotos werden jetzt geladen aber alle andere Fotos werden nicht angezeigt. Ein Lightbox2 fehler habe ich auch gelöst. Jetzt sieht die Seite ein bisschen besser aus. Die Nachrichten für Benuteraktionen funktioniert auch, 

☝️  Vergessen Sie nicht, den Code von heute auf github hochzuladen.

## 23.5

- [x] "Alle Fotos" Anzeige fehler beheben
- [ ] Albums kernfunktionalität weiterentwickeln
- [x] Die letzte SQLite fehler beheben
- [ ] beginn mit Frontend design

✍️ Heute habe ich das "Alle Fotos" Anzeige fehler gefixt. Ich habe unnötig lange daran gearbeitet obwohl der Fehler nur ein Tippfehler war. Das hat mich sehr genervt. Dann habe ich bemerkt das es einen Fehler gab bei der Kontoerstellung für den ich nicht wusste. Also habe ich das auch gefixt. Das war wie ein zusätzlicher Arbeitspaket und zuletzt habe ich sichergestellt das Fotos von anderen Konten richtig dargestellt werden. (50-100 Wörter)

☝️  Vergessen Sie nicht, den Code von heute auf github hochzuladen.

## 6.6

Ihr Projekt sollte nun alle Funktionalität haben, dass man es benutzen kann. Allerdings gibt es sicher noch Teile, welche "schöner" werden können: Layout, Code, Architektur... beschreiben Sie kurz den Stand Ihres Projekts, und leiten Sie daraus 6 solche "kosmetischen" AP für den 6.6 und den 13.6 ab.

- [ ] ...
- [ ] ...
- [ ] ...
- [ ] ...

✍️ Heute habe ich... (50-100 Wörter)

☝️  Vergessen Sie nicht, den Code von heute auf github hochzuladen.

## 13.6

- [ ] ...
- [ ] ...

✍️ Heute habe ich alle fehler die ich hatte (ausser einen) gelöst. Das laden der Bilder von anderen User ist nicht gegangen, das benutzen von Alben und die User Liste auch nicht.

☝️  Vergessen Sie nicht, den Code von heute auf github hochzuladen.

## 20.6

Was fehlt Ihrem fertigen Projekt noch, um es auszuliefern? Reicht die Zeit für ein *nice-to-have feature*?

- [ ] Alben für alle User zugänglich machen

Bereiten Sie in den verbleibenden 2 AP Ihre Präsentation vor

- [ ] Materialien der Präsentation vorbereiten
- [ ] Präsentation üben

✍️ Heute habe ich meine Präsentation vorbereitet. Ich habe mir überlegt einen QR-Code zu machen um dann die anderen auf meine Website zu redirecten und dann können alle das ausprobieren. Hoffentlich wird es nicht zu kaotisch mit den photo uploads. Ich habe auch ein Mockup für UI change gemacht aber bin unsicher ob ich es implementieren soll. 

☝️  Vergessen Sie nicht, die Unterlagen für Ihre Präsentation auf github hochzuladen.

## 27.6
