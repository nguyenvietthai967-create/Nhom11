'use strict';

const C = PhoneCore;
const KEY = 'phonehub.v1';
const page = document.body.dataset.page;

const $ = (selector) => document.querySelector(selector);

const esc = (value) => String(value).replace(
    /[&<>"']/g,
    (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[character])
);

const money = (value) => new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
}).format(value);

let db;
let cart = [];
let timer;

/* Đọc dữ liệu đã lưu */

try {
    db = JSON.parse(localStorage.getItem(KEY)) || C.seed();

    const valid = ['products', 'customers', 'orders'].every(
        (key) => Array.isArray(db[key])
    );

    if (!valid) {
        throw Error();
    }
} catch (error) {
    db = C.seed();

    alert(
        'Không đọc được dữ liệu đã lưu. Đang dùng dữ liệu mẫu trong bộ nhớ.'
    );
}

/* Các hàm dùng chung */

function commit(next) {
    try {
        localStorage.setItem(KEY, JSON.stringify(next));
        db = next;

        return true;
    } catch (error) {
        alert(
            'Không thể lưu dữ liệu. Kiểm tra quyền lưu trữ của trình duyệt; thao tác chưa được ghi nhận.'
        );

        return false;
    }
}

function toast(message) {
    $('#toast').textContent = message;

    clearTimeout(timer);

    timer = setTimeout(() => {
        $('#toast').textContent = '';
    }, 3500);
}

function modal(title, body) {
    $('#modal-title').textContent = title;
    $('#modal-body').innerHTML = body;

    $('#modal').showModal();
}

$('#close-modal').onclick = () => {
    $('#modal').close();
};

const btn = (
    text,
    action,
    id = '',
    className = 'small secondary'
) => `
    <button
        class="${className}"
        data-action="${action}"
        data-id="${esc(id)}"
    >
        ${text}
    </button>
`;

const table = (headers, rows) => `
    <div class="table-wrap">
        <table>
            <thead>
                <tr>
                    ${headers.map((header) => `
                        <th scope="col">${header}</th>
                    `).join('')}
                </tr>
            </thead>

            <tbody>
                ${rows || `
                    <tr>
                        <td colspan="${headers.length}" class="empty">
                            Chưa có dữ liệu phù hợp.
                        </td>
                    </tr>
                `}
            </tbody>
        </table>
    </div>
`;

function orderRows(orders) {
    return orders.map((order) => `
        <tr>
            <td title="${esc(order.id)}">
                ${esc(order.id.slice(0, 14))}
            </td>

            <td>
                ${new Date(order.date).toLocaleString('vi-VN')}
            </td>

            <td>${esc(order.customerName)}</td>
            <td>${money(order.total)}</td>

            <td>
                <span class="pill ${order.status === 'paid' ? '' : 'off'}">
                    ${order.status === 'paid' ? 'Đã thanh toán' : 'Đã hủy'}
                </span>
            </td>

            <td>
                ${btn('Chi tiết', 'receipt', order.id)}

                ${order.status === 'paid'
                    ? btn('Hủy', 'cancel', order.id, 'small danger')
                    : ''}
            </td>
        </tr>
    `).join('');
}

/* Trang Tổng quan */

function dashboard() {
    const paid = db.orders.filter(
        (order) => order.status === 'paid'
    );

    const revenue = paid.reduce(
        (sum, order) => sum + order.total,
        0
    );

    const stock = db.products.reduce(
        (sum, product) => sum + product.stock,
        0
    );

    const low = db.products.filter(
        (product) => product.stock <= 3
    );

    const statistics = [
        [
            'Doanh thu đã ghi nhận',
            money(revenue),
            'Toàn bộ hóa đơn chưa hủy'
        ],
        [
            'Hóa đơn',
            paid.length,
            'Đã thanh toán'
        ],
        [
            'Điện thoại trong kho',
            stock,
            'Tổng số lượng còn lại'
        ],
        [
            'Sắp hết hàng',
            low.length,
            'Tồn kho từ 0 đến 3'
        ]
    ];

    $('#subtitle').textContent =
        'Theo dõi hoạt động bán hàng và tình trạng kho.';

    $('#action').innerHTML = `
        <a class="button" href="sales.html">
            + Tạo hóa đơn
        </a>
    `;

    $('#content').innerHTML = `
        <div class="grid">
            ${statistics.map(([label, value, description]) => `
                <article class="card stat">
                    <span class="muted">${label}</span>
                    <strong>${value}</strong>
                    <small>${description}</small>
                </article>
            `).join('')}
        </div>

        <div class="split">
            <article class="card">
                <h2>Hóa đơn gần đây</h2>

                ${table(
                    [
                        'Mã',
                        'Ngày',
                        'Khách hàng',
                        'Tổng tiền',
                        'Trạng thái',
                        'Thao tác'
                    ],
                    orderRows(db.orders.slice(-5).reverse())
                )}
            </article>

            <article class="card">
                <h2>Cần bổ sung hàng</h2>

                ${table(
                    ['Sản phẩm', 'Còn lại'],
                    low.map((product) => `
                        <tr>
                            <td>
                                ${esc(product.name)}
                                <small> · ${esc(product.spec)}</small>
                            </td>

                            <td>
                                <span class="pill warn">
                                    ${product.stock} máy
                                </span>
                            </td>
                        </tr>
                    `).join('')
                )}

                <p style="margin-top: 18px;">
                    <a class="button" href="products.html">
                        Quản lý sản phẩm →
                    </a>
                </p>
            </article>
        </div>
    `;
}

/* Trang Sản phẩm */

function products() {
    $('#subtitle').textContent =
        'Quản lý danh mục, giá bán và số lượng tồn.';

    $('#action').innerHTML = btn(
        '+ Thêm sản phẩm',
        'add-product',
        '',
        ''
    );

    const brands = [
        ...new Set(db.products.map((product) => product.brand))
    ];

    $('#content').innerHTML = `
        <article class="card">
            <div class="toolbar">
                <input
                    id="search"
                    aria-label="Tìm sản phẩm"
                    placeholder="Tìm mã, tên hoặc cấu hình..."
                >

                <select id="brand" aria-label="Lọc hãng">
                    <option value="">Tất cả hãng</option>

                    ${brands.map((brand) => `
                        <option>${esc(brand)}</option>
                    `).join('')}
                </select>
            </div>

            <div id="list"></div>
        </article>
    `;

    const draw = () => {
        const keyword = $('#search').value.toLowerCase();
        const brand = $('#brand').value;

        const filteredProducts = db.products.filter((product) => {
            const text = (
                product.id + ' ' + product.name + ' ' + product.spec
            ).toLowerCase();

            return text.includes(keyword)
                && (!brand || product.brand === brand);
        });

        $('#list').innerHTML = table(
            ['Sản phẩm', 'Hãng', 'Giá bán', 'Tồn kho', 'Thao tác'],

            filteredProducts.map((product) => `
                <tr>
                    <td>
                        <div class="product-name">
                            <img
                                class="phone"
                                alt=""
                                src="images/phone.svg"
                            >

                            <div>
                                <strong>${esc(product.name)}</strong>

                                <small>
                                    ${esc(product.id)} · ${esc(product.spec)}
                                </small>
                            </div>
                        </div>
                    </td>

                    <td>${esc(product.brand)}</td>
                    <td>${money(product.price)}</td>

                    <td>
                        <span class="pill ${product.stock <= 3 ? 'warn' : ''}">
                            ${product.stock} máy
                        </span>
                    </td>

                    <td>
                        ${btn('Sửa', 'edit-product', product.id)}

                        ${btn(
                            'Xóa',
                            'delete-product',
                            product.id,
                            'small danger'
                        )}
                    </td>
                </tr>
            `).join('')
        );
    };

    $('#search').oninput = draw;
    $('#brand').onchange = draw;

    draw();
}

function productForm(id) {
    const product = db.products.find(
        (item) => item.id === id
    ) || {};

    const fields = [
        ['id', 'Mã sản phẩm', 'text'],
        ['name', 'Tên điện thoại', 'text'],
        ['brand', 'Hãng sản xuất', 'text'],
        ['spec', 'Bộ nhớ và màu sắc', 'text'],
        ['price', 'Giá bán VND', 'number'],
        ['stock', 'Số lượng tồn', 'number']
    ];

    modal(
        id ? 'Sửa sản phẩm' : 'Thêm sản phẩm',
        `
            <form id="edit-form">
                <div class="fields">
                    ${fields.map(([key, label, type]) => `
                        <label>
                            ${label}

                            <input
                                name="${key}"
                                type="${type}"
                                value="${esc(product[key] ?? '')}"
                                ${key === 'id' && id ? 'readonly' : ''}
                                required
                                maxlength="100"
                                ${type === 'number' ? `
                                    min="${key === 'price' ? 1 : 0}"
                                    step="1"
                                    max="${key === 'price' ? 1000000000 : 100000}"
                                ` : ''}
                            >
                        </label>
                    `).join('')}
                </div>

                <div class="error" role="alert"></div>

                <button>Lưu sản phẩm</button>
            </form>
        `
    );

    $('#edit-form').onsubmit = (event) => {
        event.preventDefault();

        try {
            const data = Object.fromEntries(
                new FormData(event.target)
            );

            const product = C.product(data, id, db);
            const next = structuredClone(db);

            if (id) {
                next.products = next.products.map(
                    (item) => item.id === id ? product : item
                );
            } else {
                next.products.push(product);
            }

            if (commit(next)) {
                $('#modal').close();

                products();
                toast('Đã lưu sản phẩm.');
            }
        } catch (error) {
            $('.error').textContent = error.message;
        }
    };
}

/* Trang Khách hàng */

function customers() {
    $('#subtitle').textContent =
        'Lưu thông tin liên hệ và lịch sử mua hàng.';

    $('#action').innerHTML = btn(
        '+ Thêm khách hàng',
        'add-customer',
        '',
        ''
    );

    $('#content').innerHTML = `
        <article class="card">
            <div class="toolbar">
                <input
                    id="search"
                    aria-label="Tìm khách hàng"
                    placeholder="Tìm tên hoặc số điện thoại..."
                >
            </div>

            <div id="list"></div>
        </article>
    `;

    const draw = () => {
        const keyword = $('#search').value.toLowerCase();

        const filteredCustomers = db.customers.filter((customer) => {
            const text = (
                customer.name + ' ' + customer.phone
            ).toLowerCase();

            return text.includes(keyword);
        });

        $('#list').innerHTML = table(
            [
                'Khách hàng',
                'Điện thoại',
                'Đơn đã mua',
                'Tổng chi tiêu',
                'Thao tác'
            ],

            filteredCustomers.map((customer) => {
                const orders = db.orders.filter(
                    (order) => order.customerId === customer.id
                        && order.status === 'paid'
                );

                const total = orders.reduce(
                    (sum, order) => sum + order.total,
                    0
                );

                return `
                    <tr>
                        <td>
                            <strong>${esc(customer.name)}</strong>
                        </td>

                        <td>${esc(customer.phone)}</td>
                        <td>${orders.length}</td>
                        <td>${money(total)}</td>

                        <td>
                            ${btn('Sửa', 'edit-customer', customer.id)}

                            ${btn(
                                'Xóa',
                                'delete-customer',
                                customer.id,
                                'small danger'
                            )}
                        </td>
                    </tr>
                `;
            }).join('')
        );
    };

    $('#search').oninput = draw;

    draw();
}

function customerForm(id) {
    const customer = db.customers.find(
        (item) => item.id === id
    ) || {};

    modal(
        id ? 'Sửa khách hàng' : 'Thêm khách hàng',
        `
            <form id="edit-form">
                <label>
                    Họ tên

                    <input
                        name="name"
                        required
                        maxlength="100"
                        value="${esc(customer.name || '')}"
                    >
                </label>

                <label>
                    Số điện thoại

                    <input
                        type="tel"
                        name="phone"
                        required
                        pattern="0[0-9]{9}"
                        maxlength="10"
                        value="${esc(customer.phone || '')}"
                        placeholder="0900000000"
                    >
                </label>

                <div class="error" role="alert"></div>

                <button>Lưu khách hàng</button>
            </form>
        `
    );

    $('#edit-form').onsubmit = (event) => {
        event.preventDefault();

        try {
            const data = Object.fromEntries(
                new FormData(event.target)
            );

            const customer = C.customer(data, id, db);
            const next = structuredClone(db);

            if (id) {
                next.customers = next.customers.map(
                    (item) => item.id === id ? customer : item
                );
            } else {
                next.customers.push(customer);
            }

            if (commit(next)) {
                $('#modal').close();

                customers();
                toast('Đã lưu khách hàng.');
            }
        } catch (error) {
            $('.error').textContent = error.message;
        }
    };
}

/* Trang Bán hàng */

function sales() {
    $('#subtitle').textContent =
        'Chọn điện thoại, kiểm tra tồn kho và ghi nhận thanh toán.';

    $('#content').innerHTML = `
        <div class="split">
            <article class="card">
                <h2>Chọn sản phẩm</h2>

                <div class="toolbar">
                    <input
                        id="search"
                        aria-label="Tìm điện thoại"
                        placeholder="Tìm điện thoại..."
                    >
                </div>

                <div id="sale-list"></div>
            </article>

            <article class="card">
                <h2>Hóa đơn mới</h2>

                <label>
                    Khách hàng

                    <select id="customer">
                        <option value="">Chọn khách hàng</option>

                        ${db.customers.map((customer) => `
                            <option value="${esc(customer.id)}">
                                ${esc(customer.name)} · ${esc(customer.phone)}
                            </option>
                        `).join('')}
                    </select>
                </label>

                <p>
                    <a href="customers.html">+ Quản lý khách hàng</a>
                </p>

                <div id="cart"></div>

                <label>
                    Giảm giá VND

                    <input
                        id="discount"
                        type="number"
                        min="0"
                        step="1"
                        value="0"
                    >
                </label>

                <label>
                    Thanh toán

                    <select id="payment">
                        <option>Tiền mặt</option>
                        <option>Chuyển khoản</option>
                    </select>
                </label>

                <div class="row">
                    <span>Phải trả</span>
                    <strong id="total" class="total"></strong>
                </div>

                <div id="sale-error" class="error" role="alert"></div>

                <button class="full" data-action="checkout">
                    Ghi nhận thanh toán
                </button>

                <small>
                    Đây là thao tác mô phỏng, không xử lý tiền thật.
                </small>
            </article>
        </div>
    `;

    const draw = () => {
        const keyword = $('#search').value.toLowerCase();

        const filteredProducts = db.products.filter((product) => {
            const text = (
                product.name + ' ' + product.spec
            ).toLowerCase();

            return text.includes(keyword);
        });

        $('#sale-list').innerHTML = table(
            ['Điện thoại', 'Giá', 'Tồn', ''],

            filteredProducts.map((product) => `
                <tr>
                    <td>
                        <strong>${esc(product.name)}</strong>
                        <small>${esc(product.spec)}</small>
                    </td>

                    <td>${money(product.price)}</td>
                    <td>${product.stock}</td>

                    <td>
                        <button
                            class="small"
                            data-action="add-cart"
                            data-id="${esc(product.id)}"
                            ${product.stock === 0 ? 'disabled' : ''}
                        >
                            Thêm
                        </button>
                    </td>
                </tr>
            `).join('')
        );
    };

    $('#search').oninput = draw;
    $('#discount').oninput = drawTotal;

    draw();
    drawCart();
}

function drawCart() {
    $('#cart').innerHTML = cart.length
        ? cart.map((item) => {
            const product = db.products.find(
                (product) => product.id === item.id
            );

            return `
                <div class="cart-item">
                    <strong>${esc(product.name)}</strong>

                    <div class="row">
                        <small>${money(product.price)}</small>

                        <input
                            aria-label="Số lượng ${esc(product.name)}"
                            type="number"
                            min="1"
                            max="${product.stock}"
                            step="1"
                            value="${item.qty}"
                            data-qty="${esc(item.id)}"
                        >

                        ${btn('Bỏ', 'remove-cart', item.id)}
                    </div>
                </div>
            `;
        }).join('')
        : '<div class="empty">Chưa chọn sản phẩm.</div>';

    drawTotal();
}

function drawTotal() {
    const subtotal = cart.reduce((sum, item) => {
        const product = db.products.find(
            (product) => product.id === item.id
        );

        return sum + product.price * item.qty;
    }, 0);

    const discount = Number($('#discount').value) || 0;

    $('#total').textContent = money(subtotal - discount);
}

/* Trang Báo cáo */

function reports() {
    $('#subtitle').textContent =
        'Tổng hợp doanh thu theo ngày và hiệu quả sản phẩm.';

    $('#action').innerHTML = btn(
        'Xuất CSV',
        'export',
        '',
        ''
    );

    $('#content').innerHTML = `
        <article class="card">
            <div class="toolbar">
                <label>
                    Từ ngày
                    <input id="from" type="date">
                </label>

                <label>
                    Đến ngày
                    <input id="to" type="date">
                </label>

                <label>
                    Trạng thái

                    <select id="status">
                        <option value="">Tất cả</option>
                        <option value="paid">Đã thanh toán</option>
                        <option value="cancelled">Đã hủy</option>
                    </select>
                </label>
            </div>

            <div id="report-error" class="error" role="alert"></div>
            <div id="summary"></div>
            <div id="history"></div>
        </article>

        <article class="card">
            <h2>Doanh số theo sản phẩm</h2>

            <p class="muted">
                Giá trị trước giảm giá, chỉ tính đơn đã thanh toán trong bộ lọc.
            </p>

            <div id="ranking" class="bars"></div>
        </article>
    `;

    ['#from', '#to', '#status'].forEach((selector) => {
        $(selector).onchange = drawReport;
    });

    drawReport();
}

function filtered() {
    const from = $('#from').value;
    const to = $('#to').value;
    const status = $('#status').value;

    if (from && to && from > to) {
        throw Error(
            'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.'
        );
    }

    return db.orders.filter((order) => {
        const date = new Date(order.date);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        const formattedDate = `${year}-${month}-${day}`;

        return (!from || formattedDate >= from)
            && (!to || formattedDate <= to)
            && (!status || status === order.status);
    });
}

function drawReport() {
    try {
        const orders = filtered();

        const paid = orders.filter(
            (order) => order.status === 'paid'
        );

        const revenue = paid.reduce(
            (sum, order) => sum + order.total,
            0
        );

        $('#report-error').textContent = '';

        $('#summary').innerHTML = `
            <p>
                <b>${orders.length}</b> hóa đơn
                · Doanh thu sau giảm giá:
                <b>${money(revenue)}</b>
            </p>
        `;

        $('#history').innerHTML = table(
            [
                'Mã',
                'Ngày',
                'Khách hàng',
                'Tổng tiền',
                'Trạng thái',
                'Thao tác'
            ],
            orderRows(orders.slice().reverse())
        );

        const map = {};

        paid.forEach((order) => {
            order.items.forEach((item) => {
                const data = map[item.id] || {
                    name: item.name,
                    qty: 0,
                    value: 0
                };

                data.qty += item.qty;
                data.value += item.price * item.qty;

                map[item.id] = data;
            });
        });

        const all = Object.values(map).sort(
            (a, b) => b.value - a.value
        );

        const max = Math.max(
            1,
            ...all.map((item) => item.value)
        );

        $('#ranking').innerHTML = all.length
            ? all.map((item) => `
                <div class="bar">
                    <span>${esc(item.name)}</span>

                    <i style="width: ${item.value / max * 45}%;"></i>

                    <b>${item.qty} máy · ${money(item.value)}</b>
                </div>
            `).join('')
            : '<p class="empty">Chưa có doanh số.</p>';
    } catch (error) {
        $('#report-error').textContent = error.message;
        $('#summary').innerHTML = '';
        $('#history').innerHTML = '';
        $('#ranking').innerHTML = '';
    }
}

/* Chi tiết và in hóa đơn */

function receipt(id) {
    const order = db.orders.find(
        (item) => item.id === id
    );

    modal(
        'Chi tiết hóa đơn',
        `
            <article class="receipt">
                <p>
                    <b>PHONEHUB</b> · Hóa đơn bán hàng mô phỏng
                </p>

                <p>
                    Mã: ${esc(order.id)}<br>
                    Ngày: ${new Date(order.date).toLocaleString('vi-VN')}<br>
                    Khách: ${esc(order.customerName)}
                    · ${esc(order.customerPhone)}<br>
                    Trạng thái:
                    ${order.status === 'paid' ? 'Đã thanh toán' : 'Đã hủy'}
                </p>

                ${table(
                    ['Sản phẩm', 'SL', 'Đơn giá', 'Thành tiền'],

                    order.items.map((item) => `
                        <tr>
                            <td>
                                ${esc(item.name)}<br>
                                <small>${esc(item.spec)}</small>
                            </td>

                            <td>${item.qty}</td>
                            <td>${money(item.price)}</td>
                            <td>${money(item.qty * item.price)}</td>
                        </tr>
                    `).join('')
                )}

                <p>
                    Tạm tính: ${money(order.subtotal)}<br>
                    Giảm giá: ${money(order.discount)}<br>
                    <b>Phải trả: ${money(order.total)}</b><br>
                    Hình thức: ${esc(order.payment)}
                </p>

                <small>
                    Không phải hóa đơn điện tử có giá trị pháp lý.
                </small>
            </article>

            <button data-action="print">
                In hóa đơn
            </button>
        `
    );
}

/* Xuất báo cáo CSV */

function exportCSV() {
    let orders;

    try {
        orders = filtered();
    } catch (error) {
        toast(error.message);
        return;
    }

    const cell = (value) => {
        const text = String(value)
            .replace(/^[=+@\-\t\r]/, "'$&")
            .replace(/"/g, '""');

        return '"' + text + '"';
    };

    const rows = [
        [
            'Mã',
            'Ngày',
            'Khách hàng',
            'Số điện thoại',
            'Tạm tính',
            'Giảm giá',
            'Thành tiền',
            'Trạng thái'
        ],

        ...orders.map((order) => [
            order.id,
            new Date(order.date).toLocaleString('vi-VN'),
            order.customerName,
            order.customerPhone,
            order.subtotal,
            order.discount,
            order.total,
            order.status === 'paid' ? 'Đã thanh toán' : 'Đã hủy'
        ])
    ];

    const csv = '\uFEFF' + rows
        .map((row) => row.map(cell).join(','))
        .join('\r\n');

    const blob = new Blob([csv], {
        type: 'text/csv;charset=utf-8'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'bao-cao-phonehub.csv';
    link.click();

    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 1000);
}

/* Chọn trang cần hiển thị */

const render = () => {
    const renderers = {
        index: dashboard,
        products,
        sales,
        customers,
        reports
    };

    renderers[page]();
};

/* Xử lý sự kiện nhấn nút */

document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');

    if (!button) {
        return;
    }

    const id = button.dataset.id;

    try {
        switch (button.dataset.action) {
            case 'add-product':
                productForm();
                break;

            case 'edit-product':
                productForm(id);
                break;

            case 'add-customer':
                customerForm();
                break;

            case 'edit-customer':
                customerForm(id);
                break;

            case 'delete-product':
            case 'delete-customer': {
                const isProduct =
                    button.dataset.action === 'delete-product';

                const key = isProduct ? 'products' : 'customers';

                const hasOrder = db.orders.some((order) => {
                    return isProduct
                        ? order.items.some((item) => item.id === id)
                        : order.customerId === id;
                });

                if (hasOrder) {
                    throw Error(
                        'Không thể xóa dữ liệu đã có trong hóa đơn.'
                    );
                }

                if (confirm('Bạn có chắc muốn xóa bản ghi này?')) {
                    const next = structuredClone(db);

                    next[key] = next[key].filter(
                        (item) => item.id !== id
                    );

                    if (commit(next)) {
                        render();
                        toast('Đã xóa.');
                    }
                }

                break;
            }

            case 'add-cart': {
                const product = db.products.find(
                    (product) => product.id === id
                );

                const item = cart.find(
                    (item) => item.id === id
                );

                if ((item?.qty || 0) >= product.stock) {
                    throw Error('Không đủ hàng trong kho.');
                }

                if (item) {
                    item.qty++;
                } else {
                    cart.push({
                        id,
                        qty: 1
                    });
                }

                drawCart();
                break;
            }

            case 'remove-cart':
                cart = cart.filter((item) => item.id !== id);
                drawCart();
                break;

            case 'checkout': {
                const next = C.checkout(
                    db,
                    $('#customer').value,
                    cart,
                    $('#discount').value,
                    $('#payment').value
                );

                if (commit(next)) {
                    cart = [];

                    sales();
                    receipt(db.orders.at(-1).id);
                    toast('Đã lập hóa đơn và cập nhật tồn kho.');
                }

                break;
            }

            case 'receipt':
                receipt(id);
                break;

            case 'cancel':
                if (confirm('Hủy hóa đơn và hoàn lại số lượng vào kho?')) {
                    if (commit(C.cancel(db, id))) {
                        render();
                        toast('Đã hủy hóa đơn, hoàn kho.');
                    }
                }

                break;

            case 'export':
                exportCSV();
                break;

            case 'print':
                window.print();
                break;
        }
    } catch (error) {
        if ($('#sale-error')) {
            $('#sale-error').textContent = error.message;
        } else {
            toast(error.message);
        }
    }
});

/* Thay đổi số lượng trong giỏ */

document.addEventListener('change', (event) => {
    const id = event.target.dataset.qty;

    if (!id) {
        return;
    }

    const item = cart.find(
        (item) => item.id === id
    );

    const product = db.products.find(
        (product) => product.id === id
    );

    const quantity = Number(event.target.value);

    if (
        !Number.isSafeInteger(quantity)
        || quantity < 1
        || quantity > product.stock
    ) {
        toast('Số lượng phải là số nguyên từ 1 đến tồn kho.');
        event.target.value = item.qty;
    } else {
        item.qty = quantity;
        drawTotal();
    }
});

/* Đồng bộ khi dữ liệu thay đổi ở tab khác */

window.addEventListener('storage', (event) => {
    if (event.key === KEY) {
        alert(
            'Dữ liệu đã thay đổi ở tab khác. Trang sẽ tải lại để đồng bộ.'
        );

        location.reload();
    }
});

/* Khởi tạo giao diện */

render();