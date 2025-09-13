/*
 * IceWheel Energy
 * Copyright (C) 2025 IceWheel LLC
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */

const Footer = () => {
  return (
    <footer className="mt-auto pt-4 pb-3">
      <div className="container">
        <hr />
        <div className="text-center text-muted">
          <small>
            Copyright &copy; 2025 Icewheel LLC. All Rights Reserved.
            <span className="mx-2">&middot;</span>
            <a href="https://github.com/icewheel-oss/icewheel-energy-key-beacon/" target="_blank" rel="noopener noreferrer" className="text-muted text-decoration-none">
              GitHub
            </a>
          </small>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
