import { useMemo, useState } from "react"
import { HelpCircle, MessageCircle, Phone, Search } from "lucide-react"

import PageHero from "../components/PageHero"
import { FAQ_GROUPS, searchFaq } from "../lib/faq"
import { STORE } from "../lib/navigation"
import { Accordion, Button, EmptyState, Input } from "../components/ui"

const FAQPage = () => {
  const [term, setTerm] = useState("")

  const groups = useMemo(() => searchFaq(term), [term])
  const searching = term.trim().length > 0

  return (
    <>
      <PageHero icon={<HelpCircle />} title="FAQ" breadcrumbs={[{ label: "FAQ" }]}>
        <div className="mt-5 max-w-md">
          <Input
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search questions"
            aria-label="Search questions"
            leftIcon={<Search />}
          />
        </div>
      </PageHero>

      <div className="page-container py-10 md:py-14">
        <div className="mx-auto max-w-3xl">
          {groups.length === 0 ? (
            <EmptyState
              icon={<Search />}
              title="No matches"
              description="Try a different word."
              action={<Button onClick={() => setTerm("")}>Clear search</Button>}
            />
          ) : (
            <div className="space-y-8">
              {groups.map((group) => (
                <section key={group.id}>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">{group.title}</h2>

                  <Accordion
                    className="mt-2 rounded-card border border-gray-200 bg-white px-4 shadow-card"
                    allowMultiple={searching}
                    defaultOpen={searching ? group.items.map((item) => item.id) : []}
                    /* Remount on search so the open set matches the new results. */
                    key={term}
                    items={group.items.map((item) => ({
                      id: item.id,
                      title: item.q,
                      content: item.a,
                    }))}
                  />
                </section>
              ))}
            </div>
          )}

          <div className="mt-10 flex flex-col items-center gap-4 rounded-card border border-pink-100 bg-pink-50 p-6 text-center">
            <p className="text-base font-semibold text-gray-900">Still need help?</p>

            <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
              <Button href={STORE.phoneHref} leftIcon={<Phone className="h-4 w-4" />}>
                {STORE.phone}
              </Button>
              <Button
                href={`https://wa.me/${STORE.whatsapp}`}
                variant="outline"
                leftIcon={<MessageCircle className="h-4 w-4" />}
              >
                WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default FAQPage
