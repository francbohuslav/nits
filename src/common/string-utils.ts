class StringUtils {
    public removeDiacritics(text: string): string {
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    public isEmptyHtml(text: string): boolean {
        return !text || text.trim().length == 0 || !!text.match(/<p>\s*<\/p>/) || text == "<p><br></p>";
    }
}

export default new StringUtils();
