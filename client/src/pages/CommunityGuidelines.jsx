import { Link } from 'react-router-dom'

const CommunityGuidelines = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 py-12">
      <div className="container-custom max-w-4xl">
        <div className="bg-white dark:bg-dark-900 rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Community Guidelines</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Welcome to Our Community</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                At Nexus Engineering Partners, we strive to create a professional, respectful, and collaborative environment for all users. These guidelines help ensure that everyone can communicate effectively and work together productively. By using our platform, you agree to follow these guidelines.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">1. Professional Communication</h2>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-4">✅ DO:</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4 mb-4">
                <li>Use clear, professional, and respectful language</li>
                <li>Be courteous and considerate in all interactions</li>
                <li>Respond to messages and inquiries in a timely manner</li>
                <li>Provide accurate and complete information</li>
                <li>Use appropriate tone and formatting in written communications</li>
                <li>Address others by their preferred name or title</li>
                <li>Express disagreements constructively and respectfully</li>
                <li>Give credit where credit is due</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-4">❌ DON'T:</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>Use offensive, abusive, or discriminatory language</li>
                <li>Send messages in ALL CAPS (considered shouting)</li>
                <li>Use excessive exclamation marks or emojis in professional communications</li>
                <li>Make personal attacks or insults</li>
                <li>Use profanity or inappropriate language</li>
                <li>Send spam or unsolicited bulk messages</li>
                <li>Ignore or delay responses without explanation</li>
                <li>Make assumptions about others' knowledge or background</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">2. Respect and Inclusivity</h2>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-4">✅ DO:</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4 mb-4">
                <li>Treat everyone with dignity and respect</li>
                <li>Be inclusive and welcoming to all users</li>
                <li>Respect different perspectives, cultures, and backgrounds</li>
                <li>Use gender-neutral language when appropriate</li>
                <li>Be patient and understanding with others</li>
                <li>Listen actively and consider others' viewpoints</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-4">❌ DON'T:</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>Discriminate based on race, gender, religion, nationality, or any other characteristic</li>
                <li>Make offensive jokes or comments</li>
                <li>Harass, bully, or intimidate others</li>
                <li>Exclude others from conversations or activities</li>
                <li>Make assumptions based on stereotypes</li>
                <li>Use language that could be considered offensive or insensitive</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">3. Information Sharing</h2>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-4">✅ DO:</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4 mb-4">
                <li>Share relevant and accurate information</li>
                <li>Provide context when sharing information</li>
                <li>Respect confidentiality and privacy of others</li>
                <li>Ask for permission before sharing others' information</li>
                <li>Use secure channels for sensitive information</li>
                <li>Verify information before sharing</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-4">❌ DON'T:</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>Share confidential or proprietary information without authorization</li>
                <li>Spread false information or rumors</li>
                <li>Share personal information of others without consent</li>
                <li>Post sensitive information in public channels</li>
                <li>Share misleading or incomplete information</li>
                <li>Violate non-disclosure agreements or confidentiality obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">4. Collaboration and Feedback</h2>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-4">✅ DO:</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4 mb-4">
                <li>Provide constructive and helpful feedback</li>
                <li>Be open to receiving feedback from others</li>
                <li>Collaborate effectively with team members</li>
                <li>Share knowledge and help others learn</li>
                <li>Recognize and appreciate others' contributions</li>
                <li>Communicate proactively about project status and issues</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-4">❌ DON'T:</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>Give feedback in a destructive or hurtful manner</li>
                <li>Take feedback personally or defensively</li>
                <li>Hoard information or knowledge</li>
                <li>Undermine others' work or contributions</li>
                <li>Blame others without understanding the full context</li>
                <li>Withhold important information that affects others</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">5. Conflict Resolution</h2>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-4">✅ DO:</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4 mb-4">
                <li>Address conflicts directly and professionally</li>
                <li>Focus on the issue, not the person</li>
                <li>Seek to understand before being understood</li>
                <li>Use "I" statements to express concerns</li>
                <li>Escalate serious issues to appropriate personnel</li>
                <li>Document conflicts when necessary</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-4">❌ DON'T:</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>Engage in public arguments or confrontations</li>
                <li>Make personal attacks during disagreements</li>
                <li>Spread gossip or involve others unnecessarily</li>
                <li>Ignore conflicts hoping they'll resolve themselves</li>
                <li>Retaliate or seek revenge</li>
                <li>Use social media or public forums to air grievances</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">6. Platform Usage</h2>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-4">✅ DO:</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4 mb-4">
                <li>Use the platform for its intended purposes</li>
                <li>Keep your account information up to date</li>
                <li>Report bugs or technical issues</li>
                <li>Follow platform-specific instructions and guidelines</li>
                <li>Respect system limitations and usage policies</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-4">❌ DON'T:</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>Create multiple accounts to circumvent restrictions</li>
                <li>Attempt to hack or exploit the platform</li>
                <li>Use automated tools to spam or abuse the system</li>
                <li>Share your account with others</li>
                <li>Use the platform for illegal activities</li>
                <li>Circumvent security measures</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">7. Consequences of Violations</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Violations of these guidelines may result in:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>Warning notifications</li>
                <li>Temporary suspension of account privileges</li>
                <li>Permanent account termination</li>
                <li>Legal action if violations involve illegal activities</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                We reserve the right to take appropriate action based on the severity and frequency of violations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">8. Reporting Violations</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                If you witness or experience behavior that violates these guidelines, please report it immediately:
              </p>
              <ul className="list-none text-gray-700 space-y-2">
                <li><strong>Email:</strong> support@nexusengineering.co.tz</li>
                <li><strong>Phone:</strong> +255 744 690 860</li>
                <li><strong>Include:</strong> Description of the incident, screenshots if available, and any relevant details</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                All reports will be reviewed promptly and handled confidentially.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">9. Questions or Concerns</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                If you have questions about these guidelines or need clarification on appropriate behavior, please don't hesitate to contact us. We're here to help ensure a positive experience for everyone.
              </p>
            </section>

            <section className="mb-8 bg-gray-100 dark:bg-dark-800 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Remember</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                These guidelines exist to help us all communicate effectively and work together successfully. When in doubt, ask yourself: "Would I be comfortable if this communication was shared publicly?" If the answer is no, reconsider your approach.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Thank you for helping us maintain a professional and respectful community!
              </p>
            </section>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-dark-800">
              <Link to="/contact" className="text-accent-600 hover:text-accent-700 font-medium">
                ← Back to Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CommunityGuidelines

