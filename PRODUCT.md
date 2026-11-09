# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

HTML, CSS and JavaScript as the base. The user allows other languages alongside them when a job needs one. No build step is required today, and the only local helper is a small Node server.

## Users

One person: the owner of this computer. They use it alone, in Thai, on this one machine, to see their days and keep track of what they have to do. No accounts or other users.

## Product Purpose

A personal calendar that runs from today (7 November 2026) to the end of July 2027. Each day can hold activities, duties and images. Success means the month is understood at a glance when the page opens, and using it is enjoyable enough to keep coming back.

## Positioning

A calendar that belongs to one person and is theirs to fill, with their own pictures and their own days, rather than a shared scheduling tool.

## Operating Context

Opened on a desktop browser on the owner's computer through a local start script. The month grid fills the screen as the first thing seen. Used in short visits: check what is coming, add something, tick something off.

## Capabilities and Constraints

- Calendar range is fixed: 2026-11-07 to 2027-07-31. Days before the start cannot hold entries.
- Add, edit, move, complete and delete entries of two kinds: กิจกรรม (activity) and หน้าที่ (duty).
- Add and remove SVG, JPG and PNG images on any day.
- Data lives in this browser only, with a file backup and restore. No sync, no backend, no login.
- Thai interface. Years are shown in the Common Era (ค.ศ.), as the owner writes them.
- Not in scope: recurring events, notifications, Thai public holidays, search.

## Brand Commitments

- Must not feel like an office tool (rigid, flat, Google Calendar or work-system style).
- Must not feel static: it needs playful components and interesting animation that respond when used.

## Evidence on Hand

`readme.md` is the owner's brief. No logo, name, images or real entries exist yet; the owner adds their own images and entries in use.

## Product Principles

- The month is readable at a glance before anything else.
- Everything is the owner's to add and manage directly on the calendar.
- Interaction should be a small pleasure, never at the cost of reading the dates.
- Never lose what the owner entered.
