import { Link } from 'react-router-dom'

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 py-12">
      <div className="container-custom max-w-4xl">
        <div className="bg-white dark:bg-dark-900 rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Terms of Service</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                By accessing and using the Nexus Engineering Partners website and services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">2. Use License</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Permission is granted to temporarily access the materials on Nexus Engineering Partners' website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to reverse engineer any software contained on the website</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">3. User Accounts and Communication</h2>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-4">What You SHOULD Do:</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4 mb-4">
                <li>Provide accurate and truthful information when creating an account</li>
                <li>Keep your account credentials secure and confidential</li>
                <li>Use respectful and professional language in all communications</li>
                <li>Respond to inquiries and messages in a timely manner</li>
                <li>Report any suspicious activity or security concerns immediately</li>
                <li>Follow all applicable laws and regulations when using our services</li>
                <li>Respect intellectual property rights of others</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-4">What You MUST NOT Do:</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>Share your account credentials with others</li>
                <li>Use offensive, abusive, discriminatory, or harassing language</li>
                <li>Impersonate any person or entity or misrepresent your affiliation</li>
                <li>Spam, send unsolicited messages, or engage in mass communication</li>
                <li>Upload or transmit viruses, malware, or any malicious code</li>
                <li>Attempt to gain unauthorized access to any part of the service</li>
                <li>Interfere with or disrupt the service or servers connected to the service</li>
                <li>Collect or store personal data about other users without permission</li>
                <li>Use automated systems (bots, scrapers) to access the service</li>
                <li>Engage in any activity that violates applicable laws or regulations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">4. Communication Guidelines</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                When communicating through our platform, including contact forms, messaging systems, or email:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li><strong>Be Professional:</strong> Maintain a professional tone in all communications</li>
                <li><strong>Be Clear:</strong> Provide clear and concise information</li>
                <li><strong>Be Respectful:</strong> Treat all users and staff with respect and courtesy</li>
                <li><strong>Be Patient:</strong> Allow reasonable time for responses</li>
                <li><strong>Be Honest:</strong> Provide accurate information about your needs and requirements</li>
                <li><strong>Be Confidential:</strong> Do not share confidential project information publicly</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">5. Prohibited Activities</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                You are expressly prohibited from:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>Violating any applicable local, state, national, or international law</li>
                <li>Transmitting any material that is abusive, harassing, tortious, defamatory, vulgar, obscene, or libelous</li>
                <li>Transmitting any material that infringes upon the rights of others</li>
                <li>Transmitting any material that contains software viruses or other harmful computer code</li>
                <li>Engaging in any form of data mining, data harvesting, or similar activities</li>
                <li>Using the service to compete with or harm our business</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">6. Intellectual Property</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                All content, including but not limited to text, graphics, logos, images, and software, is the property of Nexus Engineering Partners or its content suppliers and is protected by copyright and other intellectual property laws. You may not reproduce, distribute, modify, or create derivative works without express written permission.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">7. Disclaimer</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                The materials on Nexus Engineering Partners' website are provided on an 'as is' basis. Nexus Engineering Partners makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">8. Limitations of Liability</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                In no event shall Nexus Engineering Partners or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our website, even if we or an authorized representative has been notified orally or in writing of the possibility of such damage.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">9. Account Termination</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                We reserve the right to terminate or suspend your account and access to the service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms of Service. Upon termination, your right to use the service will immediately cease.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">10. Changes to Terms</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Nexus Engineering Partners may revise these terms of service at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">11. Contact Information</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <ul className="list-none text-gray-700 dark:text-gray-300 space-y-2">
                <li><strong>Email:</strong> support@nexusengineering.co.tz</li>
                <li><strong>Phone:</strong> +255 744 690 860</li>
                <li><strong>Address:</strong> Nexus Engineering Partners, Business District, Dar es Salaam, Tanzania</li>
              </ul>
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

export default TermsOfService

