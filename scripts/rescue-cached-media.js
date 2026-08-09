/**
 * One-off rescue for card media deleted from Vercel Blob by the shared-URL
 * deletion bug (deleting a cloned board deleted blobs the original still used).
 *
 * The service worker on any device that has viewed the affected boards still
 * holds the full image/audio bytes in its media cache. This script reads them
 * back out of that cache, re-uploads each one via /api/upload, and points the
 * card (or board cover) at the new URL.
 *
 * HOW TO RUN
 *   1. On a device that has recently viewed the affected boards, open
 *      https://www.myvoiceboard.com and make sure you are signed in.
 *   2. Open DevTools (F12) -> Console.
 *   3. Paste this entire file and press Enter.
 *   4. Leave the tab open — it paces itself under the upload rate limit
 *      (20/min), so ~63 items take about 4 minutes.
 *   5. Re-run on another device (e.g. your phone, via remote debugging) for
 *      anything reported as "not in cache" — different devices cached
 *      different boards.
 *
 * Safe to re-run: already-restored entries no longer match their old dead URL
 * in the DB, but re-running only costs a duplicate upload for items restored
 * in a previous run on ANOTHER device; on the same device it just repeats.
 * Best to run to completion once, then re-check which URLs are still dead.
 *
 * Generated 2026-07-13. Delete this file once the media is restored.
 */

const DEAD_MEDIA = [
  {
    "kind": "card",
    "cardId": "142063c6-f10c-49fc-b136-53d3def751a9",
    "field": "imageUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/boar-2Z2EbPQjnO3AdlZLKyRmAKxr6ehh8L.jpg",
    "label": "Boar",
    "board": "Water Animals",
    "boardId": "91313fdb-c4a9-440b-9d5f-147d44468515",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "142063c6-f10c-49fc-b136-53d3def751a9",
    "field": "audioUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/tts-1783851600546-TedQJHbsEZLD36Y8EHua8UxuM1vRZW.mp3",
    "label": "Boar",
    "board": "Water Animals",
    "boardId": "91313fdb-c4a9-440b-9d5f-147d44468515",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "fb2f794c-3af3-4966-811f-06b7ee6a2143",
    "field": "imageUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/gorilla-0V55Afly1DWY8O6WAafozYBSD2HCeu.jpg",
    "label": "Gorilla",
    "board": "noah copy",
    "boardId": "317aa38e-b109-40c1-82b9-602532de56da",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "fb2f794c-3af3-4966-811f-06b7ee6a2143",
    "field": "audioUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/tts-1783337052712-Wv4L4IkJt7l0z8MTmJJYXYavk4BHhq.mp3",
    "label": "Gorilla",
    "board": "noah copy",
    "boardId": "317aa38e-b109-40c1-82b9-602532de56da",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "4690a152-bed2-4182-bd5e-1c1d23ca641f",
    "field": "imageUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/cropped-image-2kLZ6UFZZbJ0jdmilSJZ1obNZbSd0O.jpg",
    "label": "Guitar",
    "board": "Theo PECS",
    "boardId": "d8f5bd67-a5f9-44d1-9e8f-e7fe9b84de0c",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "4690a152-bed2-4182-bd5e-1c1d23ca641f",
    "field": "audioUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/audio-1782075486785-8dOBLZ9Uo1iH1Swp9saQuYo4IKIX6k.webm",
    "label": "Guitar",
    "board": "Theo PECS",
    "boardId": "d8f5bd67-a5f9-44d1-9e8f-e7fe9b84de0c",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "572d6df0-a73c-4a26-9c1b-e0986163fff3",
    "field": "imageUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/cropped-image-tMWkdOIhGLV0I1kN01B0TuTTKfVRRM.jpg",
    "label": "Rusk",
    "board": "Theo PECS",
    "boardId": "d8f5bd67-a5f9-44d1-9e8f-e7fe9b84de0c",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "572d6df0-a73c-4a26-9c1b-e0986163fff3",
    "field": "audioUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/audio-1780994831049-3NraqrSdkMdR5CC421Gk5HBFPBODY9.webm",
    "label": "Rusk",
    "board": "Theo PECS",
    "boardId": "d8f5bd67-a5f9-44d1-9e8f-e7fe9b84de0c",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "07eccfd1-dfd0-4bf2-9168-6fc05baf9e0e",
    "field": "imageUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/duck-tzfjjhxZ5oh83mk7mGMQqOPS4lal6x.jpg",
    "label": "Duck",
    "board": "Water Animals",
    "boardId": "91313fdb-c4a9-440b-9d5f-147d44468515",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "07eccfd1-dfd0-4bf2-9168-6fc05baf9e0e",
    "field": "audioUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/tts-1783851639159-hwXqOznU7s4mubo2FU5Yb3hMRPXrNF.mp3",
    "label": "Duck",
    "board": "Water Animals",
    "boardId": "91313fdb-c4a9-440b-9d5f-147d44468515",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "0390597b-b39f-447f-b972-3071bacb8115",
    "field": "imageUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/crab-wrXAqVAG0k8uTudmxqihPUkV4cbWFt.jpg",
    "label": "Crab",
    "board": "Water Animals",
    "boardId": "91313fdb-c4a9-440b-9d5f-147d44468515",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "0390597b-b39f-447f-b972-3071bacb8115",
    "field": "audioUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/tts-1783851650160-UE5rr9Hzo8nhrsgjNnYFpPDe8FfYko.mp3",
    "label": "Crab",
    "board": "Water Animals",
    "boardId": "91313fdb-c4a9-440b-9d5f-147d44468515",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "6e98f6ca-ee72-4952-92f7-582b3d3ad6e9",
    "field": "imageUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/lion-MFsQh9bntKPu9G966YzXHntPoqh1Bc.jpg",
    "label": "Lion",
    "board": "Water Animals",
    "boardId": "91313fdb-c4a9-440b-9d5f-147d44468515",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "6e98f6ca-ee72-4952-92f7-582b3d3ad6e9",
    "field": "audioUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/tts-1783851659950-BLfee8pYHT3Nsoc0JC4pKtUXcxSyWI.mp3",
    "label": "Lion",
    "board": "Water Animals",
    "boardId": "91313fdb-c4a9-440b-9d5f-147d44468515",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "dc9b0464-ce53-4486-8afa-af21fb135818",
    "field": "imageUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/girtaffe-TRfXxwBYHWl7sllL1ALzc8qUVjKcRW.jpg",
    "label": "Giraffe",
    "board": "Water Animals",
    "boardId": "91313fdb-c4a9-440b-9d5f-147d44468515",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "dc9b0464-ce53-4486-8afa-af21fb135818",
    "field": "audioUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/tts-1783851695033-yN4wWGJK32jL4vBPLaljYaxASjz9l3.mp3",
    "label": "Giraffe",
    "board": "Water Animals",
    "boardId": "91313fdb-c4a9-440b-9d5f-147d44468515",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "80a87617-bf1e-4c8f-9d53-6707331c1fb5",
    "field": "imageUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/squid-LWoVBqLzBDwDQ4HnEd3SWxYBROq6pl.jpg",
    "label": "Squid",
    "board": "Water Animals",
    "boardId": "91313fdb-c4a9-440b-9d5f-147d44468515",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "80a87617-bf1e-4c8f-9d53-6707331c1fb5",
    "field": "audioUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/tts-1783851234154-TRlszty1tiqWJbrVJiyuICIkmZ65ho.mp3",
    "label": "Squid",
    "board": "Water Animals",
    "boardId": "91313fdb-c4a9-440b-9d5f-147d44468515",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "3ad14360-0d52-42a9-836f-f327ec94bd10",
    "field": "imageUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/zebra-FytOv47GYP3yDZgAJovnPHwum7rHrt.jpg",
    "label": "Zebra",
    "board": "Water Animals",
    "boardId": "91313fdb-c4a9-440b-9d5f-147d44468515",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "3ad14360-0d52-42a9-836f-f327ec94bd10",
    "field": "audioUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/tts-1783851236201-C9nXCywyknGCbR4Gaa04HgJAypMqDw.mp3",
    "label": "Zebra",
    "board": "Water Animals",
    "boardId": "91313fdb-c4a9-440b-9d5f-147d44468515",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "4149c71d-0a16-462b-b970-e9e706b87708",
    "field": "imageUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/cow-OJX8WoTZzroY2qkMB2W9CAYHr19bEC.jpg",
    "label": "Cow",
    "board": "Water Animals",
    "boardId": "91313fdb-c4a9-440b-9d5f-147d44468515",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "4149c71d-0a16-462b-b970-e9e706b87708",
    "field": "audioUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/tts-1783851232324-Y9BQmDGROM65e69oERf6YOqYTcXz4Q.mp3",
    "label": "Cow",
    "board": "Water Animals",
    "boardId": "91313fdb-c4a9-440b-9d5f-147d44468515",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "3958380c-6d4c-4c7e-a15d-78ec7cb66183",
    "field": "imageUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/cropped-image-mtmhXGfaBDaQxw3co01A5eHsou9i2v.jpg",
    "label": "Juice",
    "board": "Theo PECS",
    "boardId": "d8f5bd67-a5f9-44d1-9e8f-e7fe9b84de0c",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "3958380c-6d4c-4c7e-a15d-78ec7cb66183",
    "field": "audioUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/audio-1770557897917-nODPhIQJLJALf2Nn1mCODLHP5nxFcG.webm",
    "label": "Juice",
    "board": "Theo PECS",
    "boardId": "d8f5bd67-a5f9-44d1-9e8f-e7fe9b84de0c",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "cdcfef64-95eb-46cf-8d33-a30ee16186c3",
    "field": "imageUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/cropped-image-cO8gvOoZHRVTZOoq5a9osqItdZSrGH.jpg",
    "label": "Apple Pud",
    "board": "Theo PECS",
    "boardId": "d8f5bd67-a5f9-44d1-9e8f-e7fe9b84de0c",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "cdcfef64-95eb-46cf-8d33-a30ee16186c3",
    "field": "audioUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/audio-1770468799246-O72YNQl2FO4ZjU69XJaGju7JbuwpbP.webm",
    "label": "Apple Pud",
    "board": "Theo PECS",
    "boardId": "d8f5bd67-a5f9-44d1-9e8f-e7fe9b84de0c",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "d15397f7-6257-41a1-9328-0d2fa0814800",
    "field": "imageUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/butterfly-WKUNdiKbMFePkhBNI4yxaA1r8v3SNu.jpg",
    "label": "Butterfly",
    "board": "noah copy",
    "boardId": "317aa38e-b109-40c1-82b9-602532de56da",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "d15397f7-6257-41a1-9328-0d2fa0814800",
    "field": "audioUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/tts-1783337050211-mYwnQOrviJswHY0aVOJReeZbvI5QdV.mp3",
    "label": "Butterfly",
    "board": "noah copy",
    "boardId": "317aa38e-b109-40c1-82b9-602532de56da",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "3a0f1b2a-6984-45a9-9f9f-07606fac1f92",
    "field": "imageUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/dog-ZYuZq0Pxv8dXhHbY6z8cd6NVXFH07D.jpg",
    "label": "Doggy",
    "board": "noah copy",
    "boardId": "317aa38e-b109-40c1-82b9-602532de56da",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "3a0f1b2a-6984-45a9-9f9f-07606fac1f92",
    "field": "audioUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/tts-1783337051487-j4TGQWLqgqRZgEDuIL67IHzfrDeW7p.mp3",
    "label": "Doggy",
    "board": "noah copy",
    "boardId": "317aa38e-b109-40c1-82b9-602532de56da",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "15eee27b-f0fc-4ded-ab0d-e95418136039",
    "field": "imageUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/octopus-fdSBUkv9XKsDNXW8TtRTUVINCHbjGV.jpg",
    "label": "Octopus",
    "board": "Water Animals",
    "boardId": "91313fdb-c4a9-440b-9d5f-147d44468515",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "15eee27b-f0fc-4ded-ab0d-e95418136039",
    "field": "audioUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/tts-1783851225663-v7IZWFThpWeS57zYsR05UymBQ0inIE.mp3",
    "label": "Octopus",
    "board": "Water Animals",
    "boardId": "91313fdb-c4a9-440b-9d5f-147d44468515",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "e1235cd8-73ab-4c91-83e3-cbb17da4c0ff",
    "field": "imageUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/penguin-hyUcGXrIVlEUP6uEAysMamS7rAOazN.jpg",
    "label": "Penguin",
    "board": "Water Animals",
    "boardId": "91313fdb-c4a9-440b-9d5f-147d44468515",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "e1235cd8-73ab-4c91-83e3-cbb17da4c0ff",
    "field": "audioUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/tts-1783851226835-Vpnl19LTTGnodDxkpugtvpaCnbEt9c.mp3",
    "label": "Penguin",
    "board": "Water Animals",
    "boardId": "91313fdb-c4a9-440b-9d5f-147d44468515",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "cf20282b-f703-431e-8a7f-cd8ec0c48765",
    "field": "imageUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/nemo-MaCb8a2W2FZjqzo5ZrTtPgVcDHKvlP.jpg",
    "label": "Nemo",
    "board": "Water Animals",
    "boardId": "91313fdb-c4a9-440b-9d5f-147d44468515",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "cf20282b-f703-431e-8a7f-cd8ec0c48765",
    "field": "audioUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/tts-1783851227688-9jAIcE1zIPJRUwNPpxc4dGNiahihCN.mp3",
    "label": "Nemo",
    "board": "Water Animals",
    "boardId": "91313fdb-c4a9-440b-9d5f-147d44468515",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "0a6c24af-23b2-47ef-a49e-77a972ca07f2",
    "field": "imageUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/brown_horse-NA1idNqhxkzPMPv5mgXK72p8YSPm9f.jpg",
    "label": "Brown Horse",
    "board": "Water Animals",
    "boardId": "91313fdb-c4a9-440b-9d5f-147d44468515",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "0a6c24af-23b2-47ef-a49e-77a972ca07f2",
    "field": "audioUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/tts-1783851233159-ck1gnlo1VdceOxjIkxVRCtuNVPZ7hI.mp3",
    "label": "Brown Horse",
    "board": "Water Animals",
    "boardId": "91313fdb-c4a9-440b-9d5f-147d44468515",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "66f1af2e-4fad-4ae0-925d-20edfc1a41cc",
    "field": "imageUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/panda-uiCo8kRYM0e10sAzWxeFAvscyAEFR4.jpg",
    "label": "Panda",
    "board": "Water Animals",
    "boardId": "91313fdb-c4a9-440b-9d5f-147d44468515",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "66f1af2e-4fad-4ae0-925d-20edfc1a41cc",
    "field": "audioUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/tts-1783851228592-WdJAvHxeUrIhDn9uUccTrcPN25Cd90.mp3",
    "label": "Panda",
    "board": "Water Animals",
    "boardId": "91313fdb-c4a9-440b-9d5f-147d44468515",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "164df720-8350-45b2-9269-62dceabb1b71",
    "field": "imageUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/sheep-CAjwA2bHjniWb4DjzafjN090jFQoyw.jpg",
    "label": "Sheep",
    "board": "Water Animals",
    "boardId": "91313fdb-c4a9-440b-9d5f-147d44468515",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "164df720-8350-45b2-9269-62dceabb1b71",
    "field": "audioUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/tts-1783851224691-IYdE1zUO8Pyv5t7SjvoA9QkHOtb6Ab.mp3",
    "label": "Sheep",
    "board": "Water Animals",
    "boardId": "91313fdb-c4a9-440b-9d5f-147d44468515",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "75440c06-e7b8-4206-96f9-96a8ec8db324",
    "field": "imageUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/cheeta-fFADCIZb7oCJ5uwUa06qCNS4Z1K5QB.jpg",
    "label": "Cheeta",
    "board": "Water Animals",
    "boardId": "91313fdb-c4a9-440b-9d5f-147d44468515",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "75440c06-e7b8-4206-96f9-96a8ec8db324",
    "field": "audioUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/tts-1783851230093-ar8tuL9rbVgjGrKf0RIfyjQ1TLzPQF.mp3",
    "label": "Cheeta",
    "board": "Water Animals",
    "boardId": "91313fdb-c4a9-440b-9d5f-147d44468515",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "512e4ae0-369d-4fb6-88b9-3e07a85a4845",
    "field": "imageUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/PXL_20201030_111347916-78NQqeHd9MwJN8v1WJyc311pvmWDsM.jpg",
    "label": "Toast",
    "board": "Theo PECS",
    "boardId": "d8f5bd67-a5f9-44d1-9e8f-e7fe9b84de0c",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "512e4ae0-369d-4fb6-88b9-3e07a85a4845",
    "field": "audioUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/audio-1771082332913-a6Go72JoAOx7GXl3TsPfzy92lMjktL.webm",
    "label": "Toast",
    "board": "Theo PECS",
    "boardId": "d8f5bd67-a5f9-44d1-9e8f-e7fe9b84de0c",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "80f31556-3eac-49e5-93bd-4413a7d7c7c9",
    "field": "imageUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/PXL_20240213_222338445-cF4WHSbFX071ecvDauiUqN5pWudtUe.jpg",
    "label": "Honey",
    "board": "Theo PECS",
    "boardId": "d8f5bd67-a5f9-44d1-9e8f-e7fe9b84de0c",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "80f31556-3eac-49e5-93bd-4413a7d7c7c9",
    "field": "audioUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/audio-1770470486399-hLpLx0Ep7MpmhX8KjVNoa4EmmsMNeX.webm",
    "label": "Honey",
    "board": "Theo PECS",
    "boardId": "d8f5bd67-a5f9-44d1-9e8f-e7fe9b84de0c",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "234e4b7e-00fb-4974-9193-63cc15b8ab70",
    "field": "imageUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/PXL_20201021_152930644-CQr0QTBwwXPxyADnNk3PJxKpcZW0BW.jpg",
    "label": "Tea",
    "board": "Theo PECS",
    "boardId": "d8f5bd67-a5f9-44d1-9e8f-e7fe9b84de0c",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "234e4b7e-00fb-4974-9193-63cc15b8ab70",
    "field": "audioUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/audio-1770470648116-W6r2PsvzLe95TkY9RwsICkNM0ASW5l.webm",
    "label": "Tea",
    "board": "Theo PECS",
    "boardId": "d8f5bd67-a5f9-44d1-9e8f-e7fe9b84de0c",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "93421bf6-00b3-4857-986e-50a0321a229f",
    "field": "imageUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/PXL_20201021_153025318-TAf1UoogW1sXOAHDZITIWK0MQkHdqP.jpg",
    "label": "Jelly",
    "board": "Theo PECS",
    "boardId": "d8f5bd67-a5f9-44d1-9e8f-e7fe9b84de0c",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "93421bf6-00b3-4857-986e-50a0321a229f",
    "field": "audioUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/audio-1770470738098-3SHHWIf5rk04CV0YH0dGRgeVl64OVC.webm",
    "label": "Jelly",
    "board": "Theo PECS",
    "boardId": "d8f5bd67-a5f9-44d1-9e8f-e7fe9b84de0c",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "e05b1269-cfcd-4b19-bb59-2f7c0f423ba3",
    "field": "imageUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/IMG_20200322_180520-G7WN7eGKJpFSzTflkne9bA8IpV8qQv.jpg",
    "label": "Biccies ",
    "board": "Theo PECS",
    "boardId": "d8f5bd67-a5f9-44d1-9e8f-e7fe9b84de0c",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "e05b1269-cfcd-4b19-bb59-2f7c0f423ba3",
    "field": "audioUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/audio-1770470613566-5z7FTun2W8gZWCPYZSY6gYWwcibTLh.webm",
    "label": "Biccies ",
    "board": "Theo PECS",
    "boardId": "d8f5bd67-a5f9-44d1-9e8f-e7fe9b84de0c",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "a0343f30-96eb-4e7a-88fe-0ee0fa867704",
    "field": "imageUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/PXL_20240209_132303048-anVh5dL99OXbwGto0StCxSHN6T1QtJ.jpg",
    "label": "Marmalade",
    "board": "Theo PECS",
    "boardId": "d8f5bd67-a5f9-44d1-9e8f-e7fe9b84de0c",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "a0343f30-96eb-4e7a-88fe-0ee0fa867704",
    "field": "audioUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/audio-1770470683523-mpY9ZCPgPldERFNNfW1z3Jgmhw9DQk.webm",
    "label": "Marmalade",
    "board": "Theo PECS",
    "boardId": "d8f5bd67-a5f9-44d1-9e8f-e7fe9b84de0c",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "693d7c32-6477-4701-874d-22325cf9c795",
    "field": "imageUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/white-shark-d2bAuoPe1vnEkM93j3DyeMsyZ1J8Zd.jpg",
    "label": "White Shark",
    "board": "Water Animals",
    "boardId": "91313fdb-c4a9-440b-9d5f-147d44468515",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "693d7c32-6477-4701-874d-22325cf9c795",
    "field": "audioUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/tts-1783851615607-uLdog7cwVG3pqbdrGBs5DRJpmqt4be.mp3",
    "label": "White Shark",
    "board": "Water Animals",
    "boardId": "91313fdb-c4a9-440b-9d5f-147d44468515",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "c18cd442-dea2-4138-8b70-915c14232fdf",
    "field": "imageUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/pig-gN1CyfLcNPMfzW3jzItJBejgypvTz9.jpg",
    "label": "Pig",
    "board": "Water Animals",
    "boardId": "91313fdb-c4a9-440b-9d5f-147d44468515",
    "inherited": false
  },
  {
    "kind": "card",
    "cardId": "c18cd442-dea2-4138-8b70-915c14232fdf",
    "field": "audioUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/tts-1783851627665-hETxeL2J2ey4G6g9dpDDw6gGx88mT6.mp3",
    "label": "Pig",
    "board": "Water Animals",
    "boardId": "91313fdb-c4a9-440b-9d5f-147d44468515",
    "inherited": false
  },
  {
    "kind": "cover",
    "boardId": "d8f5bd67-a5f9-44d1-9e8f-e7fe9b84de0c",
    "field": "coverImageUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/board-cover-h6ttaxGiv9dlY1COXTo50XtjJAur4M.jpg",
    "board": "Theo PECS"
  },
  {
    "kind": "cover",
    "boardId": "91313fdb-c4a9-440b-9d5f-147d44468515",
    "field": "coverImageUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/board-cover-W1st6W5uVuk4xlPYDwPT2KrarB27PB.jpg",
    "board": "Water Animals"
  },
  {
    "kind": "cover",
    "boardId": "317aa38e-b109-40c1-82b9-602532de56da",
    "field": "coverImageUrl",
    "url": "https://dbmbpqscgkkwxl3j.public.blob.vercel-storage.com/board-cover-MDXjcUMAFfarvdiG4kWaThfRcqPP3m.jpg",
    "board": "noah copy"
  }
];

async function rescueCachedMedia() {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    let restored = 0, notCached = 0, failed = 0;

    for (const item of DEAD_MEDIA) {
        const name = `[${item.board}] ${item.label ?? 'board cover'} (${item.field})`;

        // The SW media cache stores CORS responses keyed by URL
        const cached = await caches.match(item.url, { ignoreVary: true });
        if (!cached) {
            notCached++;
            console.warn(`NOT IN CACHE on this device: ${name}`);
            continue;
        }

        try {
            const blob = await cached.blob();
            const contentType = blob.type || cached.headers.get('content-type') || '';
            const fileName = new URL(item.url).pathname.split('/').pop();
            const form = new FormData();
            form.append('file', new File([blob], fileName, { type: contentType }));

            let up = await fetch('/api/upload', { method: 'POST', body: form });
            if (up.status === 429) {
                console.log('Rate limited — waiting 65s then retrying...');
                await wait(65000);
                up = await fetch('/api/upload', { method: 'POST', body: form });
            }
            if (!up.ok) {
                failed++;
                console.error(`UPLOAD FAILED (${up.status}): ${name}`);
                continue;
            }
            const { url: newUrl } = await up.json();

            const target = item.kind === 'card'
                ? { path: `/api/cards/${item.cardId}`, body: { [item.field]: newUrl } }
                : { path: `/api/boards/${item.boardId}`, body: { coverImageUrl: newUrl } };
            const put = await fetch(target.path, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(target.body),
            });
            if (!put.ok) {
                failed++;
                console.error(`DB UPDATE FAILED (${put.status}): ${name}`);
                continue;
            }

            restored++;
            console.log(`restored ${restored}: ${name}`);
        } catch (err) {
            failed++;
            console.error(`ERROR: ${name}`, err);
        }

        // Stay under the 20-uploads-per-minute rate limit
        await wait(3500);
    }

    console.log(`\nDone. restored=${restored}, notInCacheOnThisDevice=${notCached}, failed=${failed}, total=${DEAD_MEDIA.length}`);
    if (notCached > 0) {
        console.log('Re-run this script on another device that has viewed the affected boards to recover the rest.');
    }
}

rescueCachedMedia();
