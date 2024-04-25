'use client'

import WritableCanvas from "./components/WritableCanvas";

export default function Document({ params }: { params: { docid: string } }) {
    const docId = params.docid
    return (
      <>
        <p>This is the docid: {docId}</p>
        <WritableCanvas/>
      </>
    );
  }
  