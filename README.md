This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, set up your environment variables:

1. Copy the `.env.example` file to `.env.local`
2. Update the values in `.env.local` with your actual configuration

```bash
cp .env.example .env.local
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment Variables

The following environment variables are required:

| Variable           | Description              | Example                                        |
| ------------------ | ------------------------ | ---------------------------------------------- |
| `GRAPHQL_ENDPOINT` | The GraphQL endpoint URL | `https://your-graphql-endpoint.com/v1/graphql` |

For local development, you can set these in `.env.local`. For production deployment on Vercel, you can set these in the Vercel dashboard under Project Settings > Environment Variables.

### Security Note

This application uses a server-side API route to proxy GraphQL requests, which keeps your actual GraphQL endpoint hidden from client-side code. The GraphQL endpoint is only visible to the server and not exposed in the browser.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

When deploying to Vercel, make sure to add your environment variables in the Vercel dashboard under Project Settings > Environment Variables.
