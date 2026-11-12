require 'json'

store = Spree::Store.default
products = JSON.parse(File.read('/tmp/avecafe-products.json'))
logo_path = '/tmp/avecafe-logo.png'
image_root = '/tmp/avecafe-products'

ActiveRecord::Base.transaction do
  channel = Spree::Channel.find_by!(store: store, code: 'online')
  catalog = channel.default_catalog || Spree::Catalog.create!(store: store, name: 'Catálogo AveCafé', active: true)
  catalog.update!(active: true)
  channel.update!(default_catalog: catalog)

  store.update!(
    default_currency: 'COP',
    supported_currencies: ['COP'],
    default_locale: 'es',
    supported_locales: 'es',
    default_country_code: 'CO'
  )

  market = store.markets.find_or_initialize_by(name: 'Colombia')
  market.assign_attributes(
    currency: 'COP', default_locale: 'es', supported_locales: 'es',
    default: true, position: 1
  )
  market.countries = ['CO']
  market.save!
  store.markets.where.not(id: market.id).update_all(default: false)

  # Keep order-linked products for historic records, but archive them and remove
  # unreferenced sample products before installing the new live catalog.
  protected_ids = Spree::LineItem.joins(:variant).distinct.pluck('spree_variants.product_id')
  Spree::Product.where(store_id: store.id).where.not(id: protected_ids).destroy_all
  Spree::Product.where(store_id: store.id, id: protected_ids).update_all(status: 'archived')
  Spree::ProductCategory.where(category_id: Spree::Category.where(store_id: store.id).select(:id)).delete_all
  Spree::Category.where(store_id: store.id).delete_all

  taxonomy = Spree::Taxonomy.create!(name: 'Catálogo AveCafé', store: store)
  root = taxonomy.create_root!(name: 'Catálogo AveCafé', store: store)
  categories = {}

  products.each_with_index do |item, index|
    category = categories[item.fetch('category')] ||= Spree::Category.create!(
      name: item.fetch('category'), store: store, parent: root, taxonomy: taxonomy
    )

    product = Spree::Product.find_or_initialize_by(store: store, slug: item.fetch('reference').downcase)
    product.assign_attributes(
      name: item.fetch('name'), description: item.fetch('description'),
      status: 'active', store: store
    )
    product.save!
    product.categories = [category]

    variant = product.variants.find_or_initialize_by(sku: item.fetch('reference'))
    variant.assign_attributes(is_master: true, track_inventory: true, cost_currency: 'COP')
    variant.save!
    product.variants.where(sku: [nil, '']).where.not(id: variant.id).where.not(id: Spree::LineItem.select(:variant_id)).destroy_all
    variant.set_price('COP', item.fetch('price'))
    variant.stock_items.find_or_create_by!(stock_location: store.stock_locations.first).set_count_on_hand(50)
    product.activate! unless product.status == 'active'
    Spree::ProductPublication.find_or_create_by!(product: product, channel: channel) { |publication| publication.published_at = Time.current }
    Spree::CatalogProduct.find_or_create_by!(product: product, catalog: catalog)

    image_path = File.join(image_root, "AVC-#{format('%03d', index + 1)}.png")
    existing_media = product.media.where(media_type: 'image').first
    if existing_media
      existing_media.attachment.purge unless existing_media.attachment.blob&.filename&.to_s == File.basename(image_path)
      if existing_media.attachment.blob&.filename&.to_s != File.basename(image_path)
        existing_media.attachment.attach(io: File.open(image_path), filename: File.basename(image_path), content_type: 'image/png')
      end
      media = existing_media
    else
      media = Spree::Media.new(store: store, viewable: product, media_type: 'image')
      media.attachment.attach(io: File.open(image_path), filename: File.basename(image_path), content_type: 'image/png')
      media.save!
    end
    product.update!(primary_media: media)
  end

  store.logo.attach(io: File.open(logo_path), filename: 'avecafe-logo.png', content_type: 'image/png') unless store.logo.attached?
  store.save!

  puts({
    market: market.reload.attributes.slice('name', 'currency', 'default_locale', 'supported_locales', 'default'),
    countries: market.country_codes,
    store: store.reload.attributes.slice('default_currency', 'supported_currencies', 'default_locale', 'supported_locales', 'default_country_code'),
    active_products: Spree::Product.where(store_id: store.id, status: 'active').count,
    archived_order_products: protected_ids.length,
    categories: Spree::Category.where(store_id: store.id).count,
    attached_product_images: Spree::Media.count,
    published_products: Spree::ProductPublication.where(channel: channel, unpublished_at: nil).joins(:product).where(spree_products: { status: 'active' }).count,
    catalog_products: catalog.catalog_products.count,
    store_logo_attached: store.logo.attached?
  }.inspect)
end
