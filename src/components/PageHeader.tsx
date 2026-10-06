"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDroplet } from "@fortawesome/free-solid-svg-icons";

export function PageHeader() {
  return (
    <header className="page__header">
      <p className="page__eyebrow">Unofficial · Residential only</p>
      <h1 className="page__title">
        <FontAwesomeIcon
          icon={faDroplet}
          className="page__title-icon"
          aria-hidden
        />
        Brisbane Water Bill Explainer
      </h1>
      <p className="page__lede">
        Adjust a few inputs to see the same line items as a City of Brisbane
        residential utility bill — and how the total changes under approved rate
        years through 2027.
      </p>
    </header>
  );
}
