import Image from "next/image";
import { FaFacebookF, FaYoutube } from "react-icons/fa";
export default function Footer() {
  return (
    <footer className="bg-black text-gray-300 py-8 px-6 md:px-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-8">
        {/* === ABOUT === */}
       {/* === ABOUT === */}
<div className="w-full md:w-[48%] min-w-0 md:pl-4 lg:pl-2">
  <h4 className="text-red-500 text-lg font-semibold mb-3 uppercase tracking-wide">
    About
  </h4>

  <p className="text-sm leading-relaxed">
    We are an{" "}
    <span className="text-red-400 font-semibold">
      Authorized Service Centre
    </span>{" "}
    for{" "}
    <span className="font-semibold text-white">
      Precihole Sports
    </span>
    , India’s leading airgun manufacturer. Our certified technicians
    ensure reliable, high-quality service using genuine parts.
  </p>

  <div className="mt-5">
    <Image
    src="/precihole1.png"
    alt="Precihole Sports"
    width={190}
    height={65}
    className="object-contain opacity-95 hover:opacity-100 transition"
/>
  </div>
</div>
        

        {/* === CONTACT === */}
        <div className="w-full md:w-[45%] min-w-0 md:text-right">
          <h4 className="text-red-500 text-lg font-semibold mb-3 uppercase tracking-wide">
            Contact
          </h4>
          <div className="flex flex-col items-start md:items-end">
            
            <p className="text-sm mb-2">
              <span className="font-semibold">Address:</span> Kathuria Gun House, Tehsil Road,Malout, 
            </p>
            
            <p className="text-sm mb-2">
              <span className="font-semibold"></span> Sri
              Muktsar Sahib, PIN 152107, Punjab
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
          </div>

          <div className="flex flex-wrap justify-center md:justify-end gap-3 mt-3">
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
        © {new Date().getFullYear()} Kathuria Gun House. Authorized Service Centre – Precihole Sports.
      </div>
    </footer>
  );
}
