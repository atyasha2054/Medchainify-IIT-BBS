"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { HiOutlineArrowLeft, HiOutlineShieldCheck } from "react-icons/hi";
import { Card, CardContent } from "@/components/ui/card";
import BackgroundPattern from "@/components/BackgroundPattern";
import {
  ShieldCheck,
  Info,
  Activity,
  Lock,
  Globe,
  UserCheck,
  Mail,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function PrivacyPolicy() {
  const lastUpdated = "May 12, 2026";

  const sections = [
    {
      title: "1. Introduction",
      icon: Info,
      color: "bg-slate-900",
      content: `Welcome to MedChainify ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice or our practices with regard to your personal information, please contact us. When you visit our website and use our services, you trust us with your personal information. We take your privacy very seriously.`,
    },
    {
      title: "2. Information We Collect",
      icon: Activity,
      color: "bg-sky-900",
      content: `We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, or otherwise when you contact us.

- **Account Information:** When you sign in using Google, we collect your name, email address, and profile picture.
- **Google User Data:** We strictly use the data obtained through Google OAuth for account creation, identification, and providing personalized services. We do not use this data for any purposes other than those essential for the operation of MedChainify.
- **Health Information:** We collect and process medical documents you upload, including prescriptions, lab reports, and medical bills, to provide our AI-driven analysis services.
- **Location Data:** We may collect information about your location to help you find nearby hospitals and healthcare providers.`,
    },
    {
      title: "3. How We Use Your Information",
      icon: UserCheck,
      color: "bg-emerald-800",
      content: `We use personal information collected via our Services for a variety of business purposes described below:

- **To provide and maintain our Service:** Including analyzing your medical documents using AI technology to provide insights.
- **To facilitate account creation and logon process:** We use the information you allowed us to collect from Google to facilitate account creation and logon process for the performance of the contract.
- **To respond to user inquiries/offer support to users:** We may use your information to respond to your inquiries and solve any potential issues you might have with the use of our Services.
- **To improve our Services:** We use data to understand how users interact with our platform and to enhance our AI models and user interface.`,
    },
    {
      title: "4. Sharing Your Information",
      icon: Globe,
      color: "bg-sky-800",
      content: `We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.

- **Service Providers:** We may share your data with third-party vendors, service providers, contractors, or agents who perform services for us or on our behalf and require access to such information to do that work (e.g., Google Generative AI for document analysis).
- **Business Transfers:** We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.`,
    },
    {
      title: "5. Data Security",
      icon: Lock,
      color: "bg-slate-800",
      content: `We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.`,
    },
    {
      title: "6. Google API Disclosure",
      icon: ShieldCheck,
      color: "bg-sky-900",
      content: `MedChainify's use and transfer to any other app of information received from Google APIs will adhere to the **Google API Service User Data Policy**, including the Limited Use requirements. We do not use Google user data to serve advertisements, and we do not sell your personal information to third parties.`,
    },
    {
      title: "7. Contact Us",
      icon: Mail,
      color: "bg-emerald-900",
      content: `If you have questions or comments about this notice, you may contact us via email at support@medchainify.com.`,
    },
  ];

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-start p-4 pt-12 pb-32">
      <BackgroundPattern />

      <div className="w-full max-w-[80%] space-y-12">
        {/* Page Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-3 text-sky-900 bg-sky-50 px-6 py-2 rounded-full border-2 border-slate-900 shadow-sm mb-4"
          >
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs uppercase tracking-[0.3em] font-bold">
              Privacy Compliance
            </span>
          </motion.div>
          <h1 className="text-4xl md:text-6xl text-slate-900 tracking-widest uppercase font-bold">
            Privacy <span className="text-sky-900">Policy</span>
          </h1>
          <p className="text-slate-500 uppercase tracking-widest text-sm max-w-md mx-auto">
            Last updated: {lastUpdated}
          </p>
          <Link
            href="/"
            className="inline-flex items-center text-sky-900 hover:text-slate-900 transition-colors uppercase tracking-[0.2em] text-xs mt-4 group"
          >
            <HiOutlineArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
            Return to Dashboard
          </Link>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 gap-8">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-2 border-slate-900 shadow-xl rounded-2xl overflow-hidden bg-white/95 backdrop-blur-sm">
                  <div
                    className={`${section.color} px-6 py-3 flex items-center gap-3`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                    <span className="text-[12px] text-white uppercase tracking-[0.2em] font-bold">
                      {section.title}
                    </span>
                  </div>
                  <CardContent className="p-8">
                    <div className="prose prose-slate max-w-none dark:prose-invert prose-p:leading-relaxed prose-p:tracking-wider prose-li:tracking-wider">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {section.content}
                      </ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
