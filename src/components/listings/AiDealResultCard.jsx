const asList = (value) => Array.isArray(value) ? value : value ? [String(value)] : [];

export default function AiDealResultCard({ result, remaining }) {
  if (!result) return null;
  if (typeof result === "string") return <section className="ai-deal-card"><h3>AI Deal Analysis</h3><p className="mt-2 whitespace-pre-wrap">{result}</p><p className="mt-3 font-bold">{remaining} AI actions left this month</p></section>;
  const risks = asList(result.risks || result.top_risks);
  const questions = asList(result.seller_questions || result.questions_to_ask_seller);
  return (
    <section className="ai-deal-card" aria-live="polite">
      <h3>AI Deal Analysis</h3>
      <p className="mt-2"><strong>Deal score:</strong> {result.deal_score ?? "Not available"}{result.verdict ? ` — ${result.verdict}` : ""}</p>
      <p><strong>Price vs market:</strong> {result.price_vs_live_market || result.price_vs_market || "Not available"}</p>
      <h4>Top Risks</h4><ul>{risks.map((risk, index) => <li key={index}>{risk}</li>)}</ul>
      <h4>Questions for the Seller</h4><ul>{questions.map((question, index) => <li key={index}>{question}</li>)}</ul>
      <p className="mt-3 font-bold">{remaining} AI actions left this month</p>
    </section>
  );
}