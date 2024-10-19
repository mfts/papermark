## App Router (/app folder)

    - layout.tsx
        - set PlausibleProvider
    - (auth)
        - layout.tsx
            - set ThemeProvider
            - use Toaster
        - register
            - User register
        - login
            - Login user

## Pages Router (/pages Folder)

    - _app.tsx
        - Write Matadat for website
        - Set SessionProvider
        - Set PostHogCustomProvider
        - Set SessionProvider
        - Set ThemeProvider
        - Set PlausibleProvider
        - Set TooltipProvider
        - if pathname from EXCLUDED_PATHS
            - then render normal Component
            - else set TeamProvider, TriggerCustomProvider

    - documents
      - index.tsx
          - First page to render after login
          - AppLayout (rfc) - Render Sidebar (rfc) and  TrialBanner (rfc)
          -  Render DocumentsList (rfc)
      - new.tsx
          - Add new documents
      - [id]
          - Show specific document information
          - Like All links, All visitors
          - Chat.tsx
              - Chat component
          - Settings.tsx
              - Document settings
    - datarooms
      - index.tsx
        - Not accessible for free users
        - Renders DataroomsList
      - [id]
        - Show specific dataroom information
    -  settings
        - general.tsx
        - branding.tsx
        - domain.tsx
        - people.tsx
        - billing.tsx
        - upgrade.tsx
    - view
      - [linkId]
      - [domains]
