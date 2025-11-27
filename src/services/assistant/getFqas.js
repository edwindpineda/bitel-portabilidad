class GetFqas {

    async getFqas(question) {
        try {
            // FAQs ahora se obtienen de la tabla tbl_faq_portabilidad en el prompt
            // Este método retorna vacío ya que no se usa búsqueda vectorial
            return "";

        } catch (error) {
            throw new Error(`[GetFqas.getFqas] ${error.message}`);
        }
    }
}

module.exports = new GetFqas();
