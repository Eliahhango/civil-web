
const fs = require("fs");
let css = fs.readFileSync("elitech/admin/admin.css", "utf8");

const tailwindCSS = `
/* KibahaScouts Style Utility Classes */
.text-gray-900 { color: #111827; }
.text-gray-700 { color: #374151; }
.text-gray-600 { color: #4B5563; }
.text-gray-500 { color: #6B7280; }
.bg-white { background-color: #ffffff; }
.bg-gray-50 { background-color: #f9fafb; }
.bg-gray-100 { background-color: #f3f4f6; }
.bg-gray-900 { background-color: #111827; }
.hover\\:bg-gray-800:hover { background-color: #1f2937; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-xs { font-size: 0.75rem; line-height: 1rem; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.rounded-xl { border-radius: 0.75rem; }
.rounded-md { border-radius: 0.375rem; }
.rounded { border-radius: 0.25rem; }
.border { border-width: 1px; }
.border-b { border-bottom-width: 1px; }
.border-t { border-top-width: 1px; }
.border-gray-200 { border-color: #e5e7eb; }
.border-gray-300 { border-color: #d1d5db; }
.shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
.p-6 { padding: 1.5rem; }
.px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
.py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
.py-4 { padding-top: 1rem; padding-bottom: 1rem; }
.py-8 { padding-top: 2rem; padding-bottom: 2rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.m-0 { margin: 0; }
.mt-0 { margin-top: 0; }
.mt-1 { margin-top: 0.25rem; }
.mt-3 { margin-top: 0.75rem; }
.mt-5 { margin-top: 1.25rem; }
.mb-1 { margin-bottom: 0.25rem; }
.mb-6 { margin-bottom: 1.5rem; }
.mr-1 { margin-right: 0.25rem; }
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.flex-wrap { flex-wrap: wrap; }
.flex-1 { flex: 1 1 0%; }
.items-center { align-items: center; }
.items-end { align-items: flex-end; }
.justify-between { justify-content: space-between; }
.justify-center { justify-content: center; }
.space-y-6 > * + * { margin-top: 1.5rem; }
.space-y-1 > * + * { margin-top: 0.25rem; }
.gap-4 { gap: 1rem; }
.w-full { width: 100%; }
.max-w-full { max-width: 100%; }
.min-w-\\[200px\\] { min-width: 200px; }
.min-w-\\[150px\\] { min-width: 150px; }
.block { display: block; }
.outline-none { outline: 2px solid transparent; outline-offset: 2px; }
.overflow-hidden { overflow: hidden; }
.overflow-x-auto { overflow-x: auto; }
.whitespace-nowrap { white-space: nowrap; }
.text-left { text-align: left; }
.text-center { text-align: center; }
.bg-red-50 { background-color: #fef2f2; }
.text-red-600 { color: #dc2626; }
.text-emerald-700 { color: #047857; }
.bg-primary\\/10 { background-color: rgba(37, 99, 235, 0.1); }
.text-primary { color: #2563eb; }
.uppercase { text-transform: uppercase; }
.hidden { display: none; }
.grid { display: grid; }
.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
@media (min-width: 768px) {
  .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
.divide-y > :not([hidden]) ~ :not([hidden]) {
    border-top-width: 1px;
    border-top-style: solid;
    border-color: #e5e7eb;
}
.kibaha-container {
    color: #111827;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
.kibaha-container input, .kibaha-container select {
    color: #111827;
}
`;

if (!css.includes("KibahaScouts Style Utility")) {
    fs.appendFileSync("elitech/admin/admin.css", tailwindCSS, "utf8");
    console.log("CSS appended.");
}
