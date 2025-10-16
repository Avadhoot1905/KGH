import { FaFacebookF, FaYoutube } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-black text-white py-12 px-6 md:px-16">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* === ROW 1: ABOUT SECTION === */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* About Text */}
          <div>
            <h4 className="text-red-500 text-lg font-semibold mb-4 uppercase tracking-wide">
              About
            </h4>
            <p className="text-gray-300 leading-relaxed">
              We are an{" "}
              <span className="text-red-400 font-semibold">
                Authorized Service Centre
              </span>{" "}
              for{" "}
              <span className="font-semibold text-white">Precihole Sports</span>,
              India’s leading airgun manufacturer. Our certified technicians
              ensure reliable, high-quality service using genuine parts.
            </p>
          </div>

          {/* Authorized Logo / Badge */}
          <div className="flex justify-center md:justify-end">
            <div className="flex items-center space-x-3 bg-[#0b1220] p-4 rounded-xl shadow-md max-w-sm w-full">
              <img
                src="/precihole-logo.png"
                alt="Precihole Authorized Service Centre"
                className="h-12 w-auto"
              />
              <div className="text-sm text-gray-400 leading-tight">
                <p className="font-semibold text-white">
                  Authorized Service Centre
                </p>
                <p>Trusted by Precihole Sports</p>
              </div>
            </div>
          </div>
        </div>

        {/* === ROW 2: QUICK LINKS + CONTACT === */}
        <div className="grid md:grid-cols-2 gap-150">
          {/* Quick Links */}
          <div>
            <h4 className="text-red-500 text-lg font-semibold mb-4 uppercase tracking-wide">
              Quick Links
            </h4>
            <ul className="space-y-2 text-gray-300">
              <li>
                <a href="#" className="hover:text-red-400 transition">
                  Who We Are
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-red-400 transition">
                  Our Services
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-red-400 transition">
                  Book Appointment
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-red-400 transition">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-red-500 text-lg font-semibold mb-4 uppercase tracking-wide">
              Contact
            </h4>
            <p className="text-gray-300 mb-3">
              <span className="font-semibold">Ph. No:</span> +91 8054218777
            </p>
            <p className="text-gray-300 mb-3">
              <span className="font-semibold">Address:</span><br />
              Tehsil Road, Sri Muktsar Sahib Malout,<br />
              PIN 152107, Punjab
            </p>
            <p className="text-gray-300">
              <span className="font-semibold">Email:</span>{" "}
              <a
                href="mailto:kathuriagunhouse@gmail.com"
                className="hover:text-red-400 transition"
              >
                kathuriagunhouse@gmail.com
              </a>
            </p>

            {/* Social Icons */}
            <div className="flex space-x-4 mt-6">
              <a
                href="https://www.facebook.com/kathuriagunhouse/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 p-2 rounded-full hover:bg-red-500 transition"
              >
                <FaFacebookF className="text-white" size={18} />
              </a>
              <a
                href="https://www.youtube.com/@kathuriagunhousearmsammuna4618"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 p-2 rounded-full hover:bg-red-500 transition"
              >
                <FaYoutube className="text-white" size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* === COPYRIGHT === */}
        <div className="text-center text-gray-500 text-sm border-t border-gray-700 pt-5">
          © 2025 Kathuria Gun House. Authorized Service Centre – Precihole Sports.
        </div>
      </div>
    </footer>
  );
}
