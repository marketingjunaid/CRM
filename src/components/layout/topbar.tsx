"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Search, Bell, ChevronDown, LogOut, User, Settings, X } from "lucide-react";
import { cn, getInitials, formatEnumLabel } from "@/lib/utils";
import axios from "axios";
import Link from "next/link";

interface SearchResult {
  leads: any[];
  contacts: any[];
  companies: any[];
  deals: any[];
}

export function Topbar({ title }: { title?: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const user = session?.user as any;

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (search.length >= 2) {
        setIsSearching(true);
        try {
          const { data } = await axios.get(`/api/search?q=${encodeURIComponent(search)}`);
          setResults(data);
          setShowSearch(true);
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults(null);
        setShowSearch(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const totalResults = results
    ? results.leads.length + results.contacts.length + results.companies.length + results.deals.length
    : 0;

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 fixed top-0 right-0 left-60 z-30">
      <div className="flex items-center gap-4">
        {title && <h1 className="text-lg font-semibold text-gray-900">{title}</h1>}
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <div className="relative" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads, contacts, deals..."
              className="pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg w-72 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {search && (
              <button
                onClick={() => { setSearch(""); setShowSearch(false); setResults(null); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {showSearch && results && (
            <div className="absolute top-full mt-2 right-0 w-96 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
              {totalResults === 0 ? (
                <div className="p-4 text-sm text-gray-500 text-center">No results found</div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {results.leads.length > 0 && (
                    <div>
                      <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase">Leads</div>
                      {results.leads.map((lead) => (
                        <Link
                          key={lead.id}
                          href={`/leads/${lead.id}`}
                          onClick={() => setShowSearch(false)}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50"
                        >
                          <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-700">
                            {getInitials(`${lead.firstName} ${lead.lastName}`)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{lead.firstName} {lead.lastName}</p>
                            <p className="text-xs text-gray-500">{lead.company || lead.email}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                  {results.contacts.length > 0 && (
                    <div>
                      <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase">Contacts</div>
                      {results.contacts.map((c) => (
                        <Link
                          key={c.id}
                          href={`/contacts/${c.id}`}
                          onClick={() => setShowSearch(false)}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50"
                        >
                          <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center text-xs font-medium text-green-700">
                            {getInitials(`${c.firstName} ${c.lastName}`)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{c.firstName} {c.lastName}</p>
                            <p className="text-xs text-gray-500">{c.company || c.email}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                  {results.companies.length > 0 && (
                    <div>
                      <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase">Companies</div>
                      {results.companies.map((co) => (
                        <Link
                          key={co.id}
                          href={`/companies/${co.id}`}
                          onClick={() => setShowSearch(false)}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50"
                        >
                          <div className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center text-xs font-medium text-purple-700">
                            {co.name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{co.name}</p>
                            <p className="text-xs text-gray-500">{co.industry || "Company"}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                  {results.deals.length > 0 && (
                    <div>
                      <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase">Deals</div>
                      {results.deals.map((d) => (
                        <Link
                          key={d.id}
                          href={`/deals/${d.id}`}
                          onClick={() => setShowSearch(false)}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50"
                        >
                          <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center text-xs font-medium text-orange-700">
                            $
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{d.title}</p>
                            <p className="text-xs text-gray-500">{formatEnumLabel(d.stage)}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user?.name ? getInitials(user.name) : "U"}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{formatEnumLabel(user?.role || "")}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <Link
                href="/settings"
                onClick={() => setShowProfile(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
