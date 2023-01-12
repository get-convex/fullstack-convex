import { useQuery } from '../../convex/_generated/react'
import { Id } from '../../convex/_generated/dataModel'

export default function TicketDetailPage({ ticketId }: { ticketId: string }) {
  const id = new Id('tickets', ticketId)
  if (!id) throw new Error(`Invalid ticket ID: ${id}`)

  // TODO getTicket will throw an error if the ID isn't valid,
  // e.g. '1234', which shouldn't happen during normal app use
  // but should be handled nonetheless (in case of e.g. manually entered route)
  const ticket = useQuery('getTicket', id)

  if (ticket === null)
    return (
      <main className="py-4">
        <h1 className="text-center">Ticket not found</h1>
      </main>
    )
  if (ticket) {
    if (ticket.error)
      return (
        <main className="py-4">
          <h1 className="text-center">{ticket.error}</h1>
        </main>
      )
    return (
      <main className="py-4">
        <h1 className="text-center">Ticket details</h1>
        <h2>{ticket.title}</h2>
        <p>{ticket.description}</p>
        <p>Owner: {ticket.owner.name}</p>
        <p>
          Created by: <span>{ticket.author.name}</span> on{' '}
          <span>{new Date(ticket._creationTime).toDateString()}</span>
        </p>
      </main>
    )
  }
}

export async function getServerSideProps({
  params,
}: {
  params: { ticketId: string }
}) {
  // Capture the dynamic route segment [ticketId] (trickier to do client side)
  const { ticketId } = params
  return {
    props: { ticketId },
  }
}
