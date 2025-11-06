import { FaFacebookF, FaYoutube } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-black text-gray-300 py-8 px-6 md:px-12">
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
        {/* === ABOUT === */}
        <div>
          <h4 className="text-red-500 text-lg font-semibold mb-3 uppercase tracking-wide">
            About
          </h4>
          <p className="text-sm leading-relaxed">
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

        {/* === QUICK LINKS === */}
        <div>
          <h4 className="text-red-500 text-lg font-semibold mb-3 uppercase tracking-wide">
            Quick Links
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="#" className="hover:text-red-400 transition">
                Who We Are
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

        {/* === CONTACT === */}
        <div>
          <h4 className="text-red-500 text-lg font-semibold mb-3 uppercase tracking-wide">
            Contact
          </h4>
          <p className="text-sm mb-2">
            <span className="font-semibold">Ph. No:</span> +91 8054218777
          </p>
          <p className="text-sm mb-2">
            <span className="font-semibold">Address:</span> Tehsil Road, Sri
            Muktsar Sahib Malout, PIN 152107, Punjab
          </p>
          <p className="text-sm">
            <span className="font-semibold">Email:</span>{" "}
            <a
              href="mailto:kathuriagunhouse@gmail.com"
              className="hover:text-red-400 transition"
            >
              kathuriagunhouse@gmail.com
            </a>
          </p>

          <div className="flex space-x-4 mt-3">
            <a
              href="https://www.facebook.com/kathuriagunhouse/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-800 p-2 rounded-full hover:bg-red-500 transition"
            >
              <FaFacebookF size={16} />
            </a>
            <a
              href="https://www.youtube.com/@kathuriagunhousearmsammuna4618"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-800 p-2 rounded-full hover:bg-red-500 transition"
            >
              <FaYoutube size={16} />
            </a>
          </div>
        </div>
      </div>

      {/* === COPYRIGHT === */}
      <div className="text-center text-gray-500 text-xs border-t border-gray-800 mt-8 pt-4">
        © 2025 Kathuria Gun House. Authorized Service Centre – Precihole Sports.
      </div>
    </footer>
  );
}
