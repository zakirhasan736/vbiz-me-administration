import type { MyCardData } from '@/interfaces/api/myCard'
import { buildProfilePath } from '@/lib/profileRoutes'
import { buildPublicCardJsonLdGraph, serializeJsonLd } from '@/lib/seo/publicCardSeo'
import { assemblePublicCardSource } from '@/lib/seo/publicCardSource'

type Props = {
  slug: string
  origin: string
  myCard: MyCardData
  sections?: Record<string, unknown> | null
}

/** Card text and JSON-LD in the first HTML response, outside the client app shell. */
export function PublicCardServerDocument({ slug, origin, myCard, sections }: Props) {
  const source = assemblePublicCardSource({ slug, origin, myCard, sections })
  const jsonLd = buildPublicCardJsonLdGraph(
    {
      slug,
      origin,
      cardPath: buildProfilePath(slug),
      myCard,
      reviews: source.reviews,
    },
    { faqs: source.faqs, products: source.products }
  )

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <article id="vcard-source">
        <h1>{source.name}</h1>
        {source.companyLine ? <p>{source.companyLine}</p> : null}
        {source.about ? <p>{source.about}</p> : null}
        {source.address ? <p>{source.address}</p> : null}
        {source.phone ? <p>{source.phone}</p> : null}
        {source.email ? <p>{source.email}</p> : null}
        {source.website ? <p>{source.website}</p> : null}
        {source.lines.length ? (
          <ul>
            {source.lines.map((line, index) => (
              <li key={`${index}-${line.slice(0, 40)}`}>{line}</li>
            ))}
          </ul>
        ) : null}
        {source.faqs.length ? (
          <section>
            <h2>FAQ</h2>
            {source.faqs.map((faq) => (
              <div key={faq.question}>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </div>
            ))}
          </section>
        ) : null}
        {source.reviews.length ? (
          <section>
            <h2>Reviews</h2>
            {source.reviews.map((review) => (
              <p key={`${review.author}-${review.text.slice(0, 24)}`}>
                {review.author}: {review.text}
              </p>
            ))}
          </section>
        ) : null}
        {source.products.length ? (
          <section>
            <h2>Products</h2>
            {source.products.map((product) => (
              <p key={product.name}>
                {product.name}
                {product.price ? ` — ${product.price}` : ''}
                {product.description ? `. ${product.description}` : ''}
              </p>
            ))}
          </section>
        ) : null}
        <a href={source.canonical}>{source.canonical}</a>
        <a href={source.markdownUrl}>Plain text version</a>
      </article>
    </>
  )
}
