"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { HiOutlineArrowLeft } from "react-icons/hi";
import { Card, CardContent } from "@/components/ui/card";
import BackgroundPattern from "@/components/BackgroundPattern";
import {
  FileText,
  Gavel,
  Scale,
  AlertTriangle,
  ShieldAlert,
  UserCheck,
  Edit3,
  HelpCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function TermsOfService() {
  const lastUpdated = "May 12, 2026";

  const sections = [
    {
      title: "1. Agreement to Terms",
      icon: Gavel,
      color: "bg-slate-900",
      content: `These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and MedChainify ("we," "our," or "us"), concerning your access to and use of the MedChainify website as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto (collectively, the "Site").`,
    },
    {
      title: "2. Medical Disclaimer",
      icon: ShieldAlert,
      color: "bg-red-900",
      content: `**IMPORTANT: MedChainify is an AI-powered information tool, not a medical provider.**

The contents of the MedChainify platform, such as text, graphics, images, and information obtained from our AI analysis, are for informational purposes only. The content is NOT intended to be a substitute for professional medical advice, diagnosis, or treatment. 

Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read on MedChainify.`,
    },
    {
      title: "3. User Representations",
      icon: UserCheck,
      color: "bg-sky-900",
      content: `By using the Site, you represent and warrant that: 
(1) all registration information you submit will be true, accurate, current, and complete; 
(2) you will maintain the accuracy of such information and promptly update such registration information as necessary; 
(3) you have the legal capacity and you agree to comply with these Terms of Service; 
(4) you are not a minor in the jurisdiction in which you reside; 
(5) you will not access the Site through automated or non-human means, whether through a bot, script, or otherwise; 
(6) you will not use the Site for any illegal or unauthorized purpose.`,
    },
    {
      title: "4. User Accounts",
      icon: Edit3,
      color: "bg-emerald-800",
      content: `To access certain features of the platform, you are required to sign in with your Google account. You agree to keep your account information secure and are responsible for all activities that occur under your account. We reserve the right to remove, reclaim, or change a username you select if we determine, in our sole discretion, that such username is inappropriate.`,
    },
    {
      title: "5. Prohibited Activities",
      icon: AlertTriangle,
      color: "bg-slate-800",
      content: `You may not access or use the Site for any purpose other than that for which we make the Site available. The Site may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.

Prohibited activities include:
- Systematically retrieving data or other content from the Site to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us.
- Circumventing, disabling, or otherwise interfering with security-related features of the Site.
- Engaging in unauthorized framing of or linking to the Site.`,
    },
    {
      title: "6. Limitation of Liability",
      icon: Scale,
      color: "bg-sky-800",
      content: `In no event will we or our directors, employees, or agents be liable to you or any third party for any direct, indirect, consequential, exemplary, incidental, special, or punitive damages, including lost profit, lost revenue, loss of data, or other damages arising from your use of the site, even if we have been advised of the possibility of such damages.`,
    },
    {
      title: "7. Modifications",
      icon: HelpCircle,
      color: "bg-slate-700",
      content: `We reserve the right to change, modify, or remove the contents of the Site at any time or for any reason at our sole discretion without notice. However, we have no obligation to update any information on our Site. We also reserve the right to modify or discontinue all or part of the Site without notice at any time.`,
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
            <FileText className="h-5 w-5" />
            <span className="text-xs uppercase tracking-[0.3em] font-bold">
              Legal Terms
            </span>
          </motion.div>
          <h1 className="text-4xl md:text-6xl text-slate-900 tracking-widest uppercase font-bold">
            Terms Of <span className="text-sky-900">Service</span>
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
