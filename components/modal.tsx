import React, { useRef, type PropsWithChildren } from 'react'
import { CircledXIcon } from './icons'

export default function Modal({
  id,
  children,
}: PropsWithChildren<{ isOpen: boolean; id: string }>) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  function openDialog() {
    if (dialogRef.current) dialogRef.current.showModal()
  }

  return (
    <div className="modal">
      <dialog
        className={`modal-dialog`}
        id={id}
        role="dialog"
        aria-labelledby={`${id}-label`}
        aria-modal="true"
        ref={dialogRef}
        onClose={() => console.log('closing')}
      >
        <button>
          <CircledXIcon />
        </button>
        {children}
      </dialog>
    </div>
  )
}
