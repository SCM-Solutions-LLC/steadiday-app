// ============================================================================
// LEGAL DOCUMENTS
// Privacy Policy, Terms of Service, and Subscription Terms
// ============================================================================

export const PRIVACY_POLICY = {
  lastUpdated: "December 2024",
  version: "1.0",
  sections: [
    {
      title: "Information We Collect",
      content: `SteadiDay collects the following types of information:

• Personal Information: Name, email address (if you create an account)
• Health Data: Medications, tasks, appointments, health screenings you track
• Device Information: Device type, operating system version, app version
• Usage Data: How you interact with the app (anonymized)

All health data is stored locally on your device by default. Cloud backup (Premium feature) encrypts your data before transmission.`,
    },
    {
      title: "How We Use Your Information",
      content: `We use your information to:

• Provide and maintain the SteadiDay app
• Send medication and task reminders
• Sync data across devices (if you enable cloud backup)
• Improve app functionality and user experience
• Process subscription payments through Apple/Google

We never sell your personal health data to third parties.`,
    },
    {
      title: "Data Storage & Security",
      content: `Your data security is our priority:

• Local Storage: All data is stored on your device using encrypted storage
• Cloud Backup: Optional encrypted backup using AES-256 encryption
• No Third-Party Sharing: Your health data is never shared with advertisers
• Data Retention: You can delete all data at any time from Settings

We comply with applicable health data protection regulations.`,
    },
    {
      title: "Your Rights",
      content: `You have the right to:

• Access all data we store about you
• Export your data in a portable format
• Delete all your data permanently
• Opt out of analytics collection
• Cancel your subscription at any time

To exercise these rights, visit Settings > Legal & Privacy or contact support.`,
    },
    {
      title: "Third-Party Services",
      content: `SteadiDay may integrate with:

• Apple Health / Google Fit (with your permission)
• Apple Calendar / Google Calendar (with your permission)
• RevenueCat (for subscription management)
• Apple App Store / Google Play Store (for payments)

Each service has its own privacy policy. We only share the minimum data required.`,
    },
    {
      title: "Changes to This Policy",
      content: `We may update this privacy policy from time to time. We will notify you of any changes by:

• Posting the new policy in the app
• Updating the "Last Updated" date
• Sending a notification for significant changes

Continued use of the app after changes constitutes acceptance of the new policy.`,
    },
    {
      title: "Contact Us",
      content: `If you have questions about this privacy policy or your data, please use the Feedback feature in the app:

Settings → Help & Support → Send Feedback

Company: SCM Solutions LLC
Location: Virginia, United States

We aim to respond to all inquiries within 48 hours.`,
    },
  ],
};

export const TERMS_OF_SERVICE = {
  lastUpdated: "December 2024",
  version: "1.0",
  sections: [
    {
      title: "Acceptance of Terms",
      content: `By downloading, installing, or using SteadiDay, you agree to be bound by these Terms of Service.

If you do not agree to these terms, do not use the app.

You must be at least 13 years old to use this app. If you are under 18, you must have parental consent.`,
    },
    {
      title: "Description of Service",
      content: `SteadiDay is a health management app that helps you:

• Track medications and receive reminders
• Manage daily tasks and appointments
• Monitor health metrics and screenings
• Contact trusted contacts quickly

The app is available in two tiers:
• Essentials (Free): Basic features with limits
• Premium: Full access to all features`,
    },
    {
      title: "Medical Disclaimer",
      content: `IMPORTANT: SteadiDay is NOT a medical device.

• The app does not provide medical advice, diagnosis, or treatment
• Always consult a qualified healthcare provider for medical decisions
• Medication reminders are aids, not replacements for professional care
• We are not responsible for missed medications or health outcomes

If you have a medical emergency, call emergency services immediately.`,
    },
    {
      title: "User Responsibilities",
      content: `You are responsible for:

• Maintaining accurate information in the app
• Keeping your device and PIN secure
• Using the app in compliance with local laws
• Not using the app for any illegal purpose
• Ensuring medication and health information is current

You agree not to misuse, reverse engineer, or attempt to access the app's source code.`,
    },
    {
      title: "Subscriptions & Payments",
      content: `Premium subscriptions are billed through Apple App Store or Google Play Store.

• Monthly: Billed monthly, cancel anytime
• Annual: Billed yearly, cancel anytime
• Lifetime: One-time payment, no renewal

Subscriptions auto-renew unless canceled 24 hours before the renewal date.

Refunds are handled by Apple/Google per their policies.`,
    },
    {
      title: "Cancellation & Refunds",
      content: `To cancel your subscription:

1. Go to your device's App Store settings
2. Find SteadiDay in subscriptions
3. Cancel the subscription

After cancellation:
• You retain Premium access until the end of the billing period
• Your data remains intact (you can export it)
• You can resubscribe at any time

Refunds are processed by Apple/Google, not by us directly.`,
    },
    {
      title: "Intellectual Property",
      content: `SteadiDay and its content are protected by copyright and trademark laws.

• The app design, code, and content are owned by SCM Solutions LLC
• You may not copy, modify, or distribute any part of the app
• User-generated content (your data) remains your property
• We have a license to use your data only to provide the service`,
    },
    {
      title: "Limitation of Liability",
      content: `To the maximum extent permitted by law:

• The app is provided "as is" without warranties
• We are not liable for any damages from app use
• We are not responsible for data loss (please backup regularly)
• Our liability is limited to the amount you paid for the app

This limitation applies to all claims, including negligence.`,
    },
    {
      title: "Changes to Terms",
      content: `We may modify these terms at any time.

• We will notify you of significant changes
• Continued use after changes constitutes acceptance
• If you disagree with changes, you may stop using the app

The "Last Updated" date reflects the most recent revision.`,
    },
    {
      title: "Governing Law",
      content: `These terms are governed by the laws of the Commonwealth of Virginia, United States.

Any disputes will be resolved through binding arbitration in Virginia, except where prohibited by law.

If any provision is found unenforceable, the remaining provisions remain in effect.`,
    },
    {
      title: "Contact",
      content: `For questions about these terms, please use the Feedback feature in the app:

Settings → Help & Support → Send Feedback

Company: SCM Solutions LLC
Location: Virginia, United States

We aim to respond within 48 hours.`,
    },
  ],
};

export const SUBSCRIPTION_TERMS = {
  lastUpdated: "December 2024",
  version: "1.0",
  tiers: [
    {
      name: "Essentials (Free)",
      features: [
        "Up to 5 medications",
        "Up to 10 tasks",
        "3 trusted contacts (1 emergency)",
        "Basic reminders",
        "Local data storage",
      ],
    },
    {
      name: "Premium Monthly",
      price: "$3.99/month",
      features: [
        "Unlimited medications",
        "Unlimited tasks",
        "Unlimited trusted contacts (all can be emergency)",
        "Health tracking (steps, water, screenings)",
        "Calendar sync",
        "Cloud backup",
        "Color themes",
        "Priority support",
      ],
    },
    {
      name: "Premium Annual",
      price: "$29.99/year",
      savings: "Save 37%",
      features: ["All Premium features", "Best value for recurring billing"],
    },
    {
      name: "Premium Lifetime",
      price: "$59.99 one-time",
      features: ["All Premium features forever", "No recurring charges"],
    },
  ],
  sections: [
    {
      title: "Billing",
      content: `• Subscriptions are processed through your App Store account
• Payment is charged upon purchase confirmation
• Subscriptions auto-renew unless canceled 24 hours before renewal
• You can manage subscriptions in your device settings`,
    },
    {
      title: "Free Trial",
      content: `If offered, free trials work as follows:
• Trial period specified at signup
• Full Premium access during trial
• Subscription begins when trial ends
• Cancel before trial ends to avoid charges`,
    },
    {
      title: "Cancellation",
      content: `• Cancel anytime through your App Store settings
• Premium access continues until billing period ends
• No refunds for partial billing periods
• Lifetime purchases are non-refundable`,
    },
    {
      title: "Data After Cancellation",
      content: `When your Premium expires:
• Your data is NOT deleted
• You keep Essentials access
• Extra items are preserved but not accessible
• Resubscribe to regain full access`,
    },
  ],
};
