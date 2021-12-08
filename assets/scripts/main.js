
/* Constructors */

class Product {
	constructor(product) {
		this.id = product.id
		this.title = product.title
		this.brand = product.brand
		this.sku = product.sku
		this.category = product.category
		this.types = product.types
		this.active = product.active
		this.discontinued = product.discontinued
		this.piece = product.piece
		this.dateAdded = product.dateAddedFull
		this.image = product.image.url
		this.url = product.editUrl
	}
}

/* Component Registration Settings */

let FilterComponent = {
	props: {
		type: String,
		title: String,
		dataType: String,
		page: Number,
	},
	template: `
		<div class="input">
			<label :for="dataType">{{title}}</label>

			<select :id="dataType" v-if="type == 'select'" @change="onChange($event)" v-model="selected">
				<option value="">--</option>
				<option v-for="option in options" :value="option.id">{{ option.title }}{{ option.active == 0 ? ' (inactive)' : ''}}</option>
			</select>
			
		</div>
	`,
	data: function() {
		return {
			options: [],
			selected: '',
		}
	},
	mounted() {
		//Fetch filter options
		fetch('https://api.rachelplamondon.dev/get-filters.json') //Dummy API
			.then(response => response.json())
			.then(data => {
				if(data.status) {
					//Set options
					this.options = data.options
				}
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	},
	methods: {
		onChange(event) {
			//Add new filter for fetching products
			const newFilter = []
			newFilter[this.dataType] = this.selected
			
			//Filter products & go back to page 1
			this.$emit('filterProducts', 'filter', 1, newFilter)
		}
	}
}

let LoadMoreButtonComponent = {
	props: {
		page: Number,
		buttonText: String,
		disabled: Boolean,
	},
	template: `
		<button class="load-more" @click="onClick($event)" :disabled="disabled">{{ buttonText }}</button>
	`,
	data: function() {
		return {
			
		}
	},
	computed: {
		nextPage: function() {
			return this.page + 1
		}
	},
	methods: {
		onClick(event) {
			//Go to next page
			this.$emit('filterProducts', 'pagination', this.nextPage)
		}
	}
}

/* Root Vue element */
const VisualCatalog = {
  data() {
    return {
			isLoading: true,
			isFinished: false,
      items: [],
			count: 0,
			page: 1,
			filters: [],
    }
  },
	computed: {
		loadingButtonText: function() {
			return this.isLoading ? 'Loading...' : 'Load More'
		}
	},
	methods: {
		fetchProducts(fetchType, page, newFilter=[]) {

			this.isLoading = true

			//Set page
			this.page = page

			//Add new filter to data
			this.filters = { ...this.filters, ...newFilter }

			//Set URL
			const url = new URL('https://api.rachelplamondon.dev/get-products.json'); //Dummy API
			const params = {
				page: this.page,
				filters: JSON.stringify(this.filters),
			}
			url.search = new URLSearchParams(params);

			//Fetch data from DB
			fetch(url)
				.then(response => response.json())
				.then(data => {
					if(data.status) {

						//Convert items to Product
						let products = data.products.map(function(a){
							return new Product(a)
						})

						switch (fetchType) {
							case 'pagination':

								//Append products to data
								for (let i = 0; i < products.length; i++){
									this.items.push(products[i]); 
								}
								
							break;
							case 'filter':

								//Replace data with products
								this.items = products

							break;
						}

						//Set total # of products
						this.count = data.count

						//App is no longer actively loading products
						this.isLoading = false

						//Determine if there are more products that could load
						this.isFinished = this.items.length == this.count

					}
				})
				.catch((error) => {
					console.error('Error:', error)
				})
			
		}
	},
	mounted() {
		//Fetch page 1 of products
		this.fetchProducts('pagination', 1)
	},
	template: `
		<div class="catalog-container">
			<div class="filters">
				<div class="title">Filter by</div>
				<div class="fields">
					<filter-field type="select" title="Brand" data-type="brand" @filterProducts="fetchProducts"></filter-field>
					<filter-field type="select" title="Category" data-type="category" @filterProducts="fetchProducts"></filter-field>
					<filter-field type="select" title="Active" data-type="active" @filterProducts="fetchProducts"></filter-field>
					<filter-field type="select" title="Discontinued" data-type="discontinued" @filterProducts="fetchProducts"></filter-field>
				</div>
			</div>
			<p class="count">{{ new Intl.NumberFormat().format(count) }} Results</p>
			<ul class="products">
				<li v-for="item in items">
					<a :href=item.url target="_blank"><img :src="item.image" :alt=item.title loading="lazy"></a>

					<h2 class="title"><a :href=item.url target="_blank">{{ item.title }}</a></h2>

					<p class="brand">{{ item.brand }}</p>

					<p class="sku">{{ item.sku }}</p>

					<p class="category">{{ item.category }}</p>

					<p class="types">{{ item.types.map(function(a){
						return a.title
					}).join(',') }}</p>

					<p class="icons">
						<span v-if="item.active == 1" class="active isActive" title="Active"><i class="fas fa-check-circle"></i></span>
						<span v-else class="active isNotActive" title="Inactive"><i class="fas fa-times-circle"></i></span>

						<span v-if="item.discontinued == 1" class="discontinued isDiscontinued" title="Discontinued"><i class="fas fa-exclamation-triangle"></i></span>
						<span v-else class="discontinued isNotDiscontinued" title="Not Discontinued"><i class="fas fa-exclamation-triangle"></i></span>

						<span v-if="item.piece == 1" class="piece isPiece"><i class="fas fa-puzzle-piece"></i></span>
					</p>

					<p class="added">Added: {{ item.dateAdded }}</p>

					<p class="edit"><a :href=item.url target="_blank">Edit <i class="fa fa-external-link-alt"></i></a></p>
				</li>
			</ul>
			<load-more-button @filterProducts="fetchProducts" :page="page" :buttonText=" loadingButtonText" :disabled="isLoading" v-show="!isFinished"></load-more-button>
		</div>
	`,
}

Vue.createApp(VisualCatalog)
	.component('filter-field', FilterComponent)
	.component('load-more-button', LoadMoreButtonComponent)
	.mount('#visual-catalog')