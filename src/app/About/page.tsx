import React from "react";
import Navbar from "@/app/components1/Navbar";
import Footer from "@/app/components1/Footer";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, MapPin, Award, Phone, Mail, HelpCircle } from "lucide-react";

export default function AboutPage() {
  const faqs = [
    {
      question: "Do I need a license to purchase Air Guns or Air Pistols?",
      answer: "Air guns with a caliber of .177 (4.5mm) and muzzle energy below 20 Joules do not require an arms license under the Indian Arms Act. However, proof of age/ID is required. Items marked 'License Required' (.22 caliber or firearms) require a valid Indian Arms License."
    },
    {
      question: "How long does shipping and delivery take?",
      answer: "Orders bound for Punjab, Delhi & NCR / North India are delivered within 3 to 4 days. Delivery to other parts of India takes approximately 3 weeks as items undergo post-order inspection and secure transport from our Malout, Punjab headquarters."
    },
    {
      question: "How can I track my order status?",
      answer: "Once your order is dispatched, you will receive a direct tracking link from our delivery partner (e.g. Delhivery/BlueDart) in your profile order history and via email."
    },
    {
      question: "Are your products authentic and warrantied?",
      answer: "Yes, Kathuria Gun House is an Authorized Service Centre for Precihole Sports (India's leading airgun manufacturer). All products sold are 100% genuine and covered by official manufacturer warranties."
    },
    {
      question: "Can I cancel or return my order?",
      answer: "Order cancellation is available directly from your Profile dashboard before dispatch. Returns can be initiated through the Returns section in your profile within 7 days of delivery for damaged or defective items."
    }
  ];

  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            About <span className="text-red-600">Kathuria Gun House</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Authorized Dealer & Certified Service Centre for Premium Sports Airguns & Accessories in India.
          </p>
        </div>

        {/* Story Section */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-red-500">Our Legacy & Commitment</h2>
            <p className="text-gray-300 leading-relaxed">
              Kathuria Gun House is a trusted name in sports armaments, target shooting equipment, and air arms. Located in Malout, Punjab, we provide shooters, target practitioners, and sports enthusiasts with high-precision equipment adhering strictly to Indian Arms Laws.
            </p>
            <p className="text-gray-300 leading-relaxed">
              We take pride in being an <span className="text-red-400 font-semibold">Authorized Service Centre for Precihole Sports</span>, equipping shooters with factory-certified repairs, genuine spare parts, and expert gunsmithing services.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 bg-[#181818] px-4 py-2 rounded-lg border border-gray-800 text-sm">
                <Award className="w-5 h-5 text-red-500" />
                <span>Authorized Precihole Partner</span>
              </div>
              <div className="flex items-center gap-2 bg-[#181818] px-4 py-2 rounded-lg border border-gray-800 text-sm">
                <ShieldCheck className="w-5 h-5 text-red-500" />
                <span>100% Legal & Certified</span>
              </div>
            </div>
          </div>

          <div className="bg-[#111] p-8 rounded-2xl border border-gray-800 flex flex-col items-center text-center">
            <Image
              src="/precihole1.png"
              alt="Precihole Sports Partner"
              width={240}
              height={80}
              className="object-contain mb-6"
            />
            <h3 className="text-xl font-semibold mb-2">Precihole Authorized Service Centre</h3>
            <p className="text-sm text-gray-400 max-w-md">
              Certified technicians providing authentic repairs, tuning, and maintenance using genuine manufacturer parts.
            </p>
          </div>
        </div>

        {/* Location & Contact Banner */}
        <div className="bg-[#141414] border border-gray-800 rounded-2xl p-8 mb-16 grid md:grid-cols-3 gap-6">
          <div className="flex items-start gap-4">
            <MapPin className="w-6 h-6 text-red-600 shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-white mb-1">Headquarters</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Kathuria Gun House, Tehsil Road, Malout,<br />
                Sri Muktsar Sahib, PIN 152107, Punjab
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Mail className="w-6 h-6 text-red-600 shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-white mb-1">Email Us</h4>
              <a href="mailto:kathuriagunhouse@gmail.com" className="text-xs text-red-400 hover:underline">
                kathuriagunhouse@gmail.com
              </a>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Phone className="w-6 h-6 text-red-600 shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-white mb-1">Store Hours</h4>
              <p className="text-xs text-gray-400">
                Mon - Sat: 10:00 AM - 7:00 PM<br />
                Sunday: Closed
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <div className="flex items-center gap-3 mb-8">
            <HelpCircle className="w-8 h-8 text-red-600" />
            <h2 className="text-3xl font-bold text-white">Frequently Asked Questions (FAQ)</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-[#121212] border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-red-400 mb-2">
                  {faq.question}
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link href="/Shop" className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-xl transition">
            Explore Products
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
